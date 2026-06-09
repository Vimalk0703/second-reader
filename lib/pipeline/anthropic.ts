import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export function modelId(): string {
  return process.env.SECOND_READER_MODEL || DEFAULT_MODEL;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

export function loadPrompt(name: "extractor" | "refuter" | "probes"): {
  text: string;
  version: string;
} {
  const text = fs.readFileSync(path.join(PROMPTS_DIR, `${name}.md`), "utf8");
  const version = text.match(/version:\s*([\d.]+)/)?.[1] ?? "unknown";
  return { text, version };
}

/**
 * One model call with a forced tool whose input schema is the zod contract.
 * Invalid output gets exactly one repair attempt with the validation errors
 * echoed back; a second failure throws — the pipeline fails loudly rather
 * than shipping unvalidated structure.
 */
export async function callStage<T>(opts: {
  stage: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const client = new Anthropic();
  const tool = {
    name: `emit_${opts.stage}`,
    description: `Return the ${opts.stage} stage output as structured data.`,
    input_schema: z.toJSONSchema(opts.schema) as Anthropic.Tool["input_schema"],
  };

  const ask = async (repairNote?: string): Promise<unknown> => {
    const response = await client.messages.create({
      model: modelId(),
      max_tokens: opts.maxTokens ?? 8192,
      system: opts.system,
      messages: [
        {
          role: "user",
          content: repairNote ? `${opts.user}\n\n${repairNote}` : opts.user,
        },
      ],
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
    });
    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(`${opts.stage}: model returned no tool call`);
    }
    return toolUse.input;
  };

  const first = opts.schema.safeParse(await ask());
  if (first.success) return first.data;

  const repair = opts.schema.safeParse(
    await ask(
      `Your previous output failed validation:\n${first.error.message}\nReturn corrected output that satisfies the schema exactly.`
    )
  );
  if (repair.success) return repair.data;
  throw new Error(`${opts.stage}: output failed validation twice: ${repair.error.message}`);
}
