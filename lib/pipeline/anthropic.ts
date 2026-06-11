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
 * Escape raw control characters (newline, carriage return, tab) that appear
 * *inside* a JSON string literal. Models that stringify an array sometimes copy
 * multi-line source text into a quote without escaping the newlines, which is
 * invalid JSON. This walks the text tracking string context and escapes only
 * the offending characters — structure between tokens is untouched.
 */
function escapeRawControlChars(s: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of s) {
    if (escaped) {
      out += ch;
      escaped = false;
    } else if (ch === "\\") {
      out += ch;
      escaped = true;
    } else if (ch === '"') {
      inString = !inString;
      out += ch;
    } else if (inString && ch === "\n") {
      out += "\\n";
    } else if (inString && ch === "\r") {
      out += "\\r";
    } else if (inString && ch === "\t") {
      out += "\\t";
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Lossless transport-level normalization: models occasionally return an
 * array/object field as its JSON-stringified form (sometimes fenced in
 * markdown, sometimes with unescaped newlines inside the quotes). Parsing such
 * strings back is not content repair — no information changes — so it happens
 * before validation. Anything still invalid fails validation loudly.
 */
export function normalizeToolInput(input: unknown): unknown {
  if (typeof input === "string") {
    let s = input.trim();
    const fenced = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenced) s = fenced[1].trim();
    if (s.startsWith("[") || s.startsWith("{")) {
      for (const candidate of [s, escapeRawControlChars(s)]) {
        try {
          return normalizeToolInput(JSON.parse(candidate));
        } catch {
          // try the next repair, then fall through to the original
        }
      }
      return input;
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
    // The directive matters for large, quote-heavy inputs (e.g. the dogfood
    // fixture): without it the model sometimes returns an array field as a
    // JSON-encoded *string* with the source's own quote marks left unescaped,
    // producing invalid JSON that can't be repaired generically. Forcing native
    // JSON types avoids the problem at the source.
    description: `Return the ${opts.stage} stage output as structured data. Every field must be a native JSON value: arrays as JSON arrays, objects as JSON objects. Never encode a field as a JSON-encoded string — for example, "claims" must be a JSON array, not a string that contains an array.`,
    input_schema: z.toJSONSchema(opts.schema) as Anthropic.Tool["input_schema"],
  };

  const ask = async (repairNote?: string): Promise<unknown> => {
    // Streamed: the largest submissions (the dogfood fixture — this repo's own
    // README + DECISIONS) need a high token ceiling to avoid a truncated,
    // unparseable response, and the SDK requires streaming once the ceiling is
    // high enough that a request could run long. finalMessage() reassembles
    // the complete tool call, so downstream handling is unchanged.
    const response = await client.messages
      .stream({
        model: modelId(),
        max_tokens: opts.maxTokens ?? 32000,
        system: opts.system,
        messages: [
          {
            role: "user",
            content: repairNote ? `${opts.user}\n\n${repairNote}` : opts.user,
          },
        ],
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
      })
      .finalMessage();
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
