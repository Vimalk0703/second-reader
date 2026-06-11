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
 * Lossless transport-level normalization: models occasionally return an
 * array/object field as its JSON-stringified form. Parsing such strings back
 * is not content repair — no information changes — so it happens before
 * validation. Anything else invalid still fails validation loudly.
 */
function normalizeToolInput(input: unknown): unknown {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return normalizeToolInput(JSON.parse(trimmed));
      } catch {
        return input;
      }
    }
    return input;
  }
  if (Array.isArray(input)) return input.map(normalizeToolInput);
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [k, normalizeToolInput(v)])
    );
  }
  return input;
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
      // Generous cap: the largest submissions (e.g. the dogfood fixture — this
      // repo's own README + DECISIONS) produce 25+ cards, and a truncated
      // response comes back as an unparseable partial array.
      max_tokens: opts.maxTokens ?? 16000,
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
    return normalizeToolInput(toolUse.input);
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
