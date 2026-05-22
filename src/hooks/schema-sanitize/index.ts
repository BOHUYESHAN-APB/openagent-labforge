/**
 * Schema sanitize: cleans dirty JSON Schemas before they're sent to the LLM.
 *
 * Inspired by DeepSeek-TUI's schema_sanitize.rs.
 *
 * Fixes common MCP tool schema problems that cause DeepSeek 400 errors:
 * - Collapse `anyOf[..., {"type":"null"}]` → `nullable: true`
 * - Inject `properties: {}` on bare-object schemas
 * - Prune dangling `required` entries
 * - Collapse single-element `oneOf` / `allOf`
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function isObject(v: JsonValue): v is Record<string, JsonValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function collapseNullableUnions(schema: Record<string, JsonValue>): void {
  for (const key of ['anyOf', 'oneOf']) {
    const members = schema[key];
    if (!Array.isArray(members)) continue;
    if (members.length < 2) continue;
    const nullIdx = members.findIndex((m) => isObject(m) && m.type === 'null');
    if (nullIdx === -1) continue;
    const nonNull = members.find(
      (m, i) => i !== nullIdx && isObject(m) && m.type !== 'null',
    );
    if (!nonNull || !isObject(nonNull)) continue;
    delete schema[key];
    for (const [k, v] of Object.entries(nonNull)) {
      if (k !== 'type' || v !== null) {
        schema[k] = v;
      }
    }
    schema['nullable'] = true;
  }
}

function injectPropertiesOnBareObjects(
  schema: Record<string, JsonValue>,
): void {
  if (schema.type !== 'object') return;
  if ('properties' in schema || 'additionalProperties' in schema) return;
  schema['properties'] = {};
}

function pruneDanglingRequired(schema: Record<string, JsonValue>): void {
  const props = schema['properties'];
  const knownKeys = isObject(props) ? Object.keys(props) : [];
  const required = schema['required'];
  if (!Array.isArray(required)) return;
  const filtered = required.filter(
    (r) => typeof r === 'string' && knownKeys.includes(r),
  );
  if (filtered.length === 0) {
    delete schema['required'];
  } else {
    schema['required'] = filtered;
  }
}

function collapseSingleElementUnions(schema: Record<string, JsonValue>): void {
  for (const key of ['oneOf', 'allOf', 'anyOf']) {
    const arr = schema[key];
    if (!Array.isArray(arr) || arr.length !== 1) continue;
    const inner = arr[0];
    delete schema[key];
    if (isObject(inner)) {
      for (const [k, v] of Object.entries(inner)) {
        if (!(k in schema)) {
          schema[k] = v as JsonValue;
        }
      }
    }
  }
}

function sanitizeNode(value: JsonValue): void {
  if (isObject(value)) {
    collapseNullableUnions(value);
    injectPropertiesOnBareObjects(value);
    pruneDanglingRequired(value);
    collapseSingleElementUnions(value);
    for (const v of Object.values(value)) {
      sanitizeNode(v);
    }
  } else if (Array.isArray(value)) {
    for (const v of value) {
      sanitizeNode(v);
    }
  }
}

/**
 * Sanitize a JSON Schema in-place for DeepSeek compatibility.
 */
export function sanitizeSchema(schema: JsonValue): void {
  sanitizeNode(schema);
}

/**
 * Sanitize only if the model is a DeepSeek variant.
 */
export function shouldSanitize(providerID: string): boolean {
  const lower = providerID.toLowerCase();
  return lower.includes('deepseek') || lower.includes('openai-compatible');
}
