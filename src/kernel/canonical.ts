import { createHash } from "node:crypto";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

function normalize(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`non-finite number at ${path}`);
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => normalize(item, `${path}[${index}]`));
  if (typeof value === "object") {
    const out: Record<string, JsonValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child === undefined) throw new TypeError(`undefined at ${path}.${key}`);
      out[key] = normalize(child, `${path}.${key}`);
    }
    return out;
  }
  throw new TypeError(`unsupported JSON value at ${path}: ${typeof value}`);
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

export function stableId(namespace: string, value: unknown): string {
  if (!namespace.trim()) throw new TypeError("namespace is required");
  return `${namespace}/${sha256Canonical(value).slice(0, 24)}`;
}
