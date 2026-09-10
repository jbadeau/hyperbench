import { componentDefinitions } from "./catalog.js";

/**
 * Runtime description of a component's props, for building an editor UI.
 *
 * Derived from the catalog's zod schemas rather than hand-listed, so a
 * component gaining a prop gains an editor control without anyone remembering
 * to update a second list.
 */

export type PropKind =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "string[]"
  | "number[]"
  | "object[]"
  | "record"
  | "unknown";

export interface PropSchema {
  name: string;
  kind: PropKind;
  optional: boolean;
  /** Allowed values, when the prop is an enum. */
  values?: string[];
  /** Field names of each entry, when the prop is an array of objects. */
  fields?: PropSchema[];
}

export interface ComponentSchema {
  type: string;
  description?: string;
  slots: string[];
  props: PropSchema[];
}

/** zod v4 keeps its definition under `_zod.def`; older builds use `def`. */
function def(zt: any): any {
  return zt?._zod?.def ?? zt?.def ?? zt?._def;
}

function shapeOf(zt: any): Record<string, any> | null {
  const d = def(zt);
  if (!d) return null;
  if (d.type === "object" || d.typeName === "ZodObject") {
    return typeof d.shape === "function" ? d.shape() : (d.shape ?? null);
  }
  return null;
}

function describe(name: string, zt: any, depth = 0): PropSchema {
  let node = zt;
  let optional = false;

  // Unwrap the optional/nullable/default wrappers to reach the real type.
  for (let i = 0; i < 6; i++) {
    const d = def(node);
    if (!d) break;
    if (d.type === "optional" || d.type === "nullable" || d.type === "default") {
      optional = true;
      node = d.innerType;
      continue;
    }
    break;
  }

  const d = def(node);
  const t = d?.type;

  if (t === "string") return { name, kind: "string", optional };
  if (t === "number") return { name, kind: "number", optional };
  if (t === "boolean") return { name, kind: "boolean", optional };

  if (t === "enum") {
    const values = Object.values(d.entries ?? d.values ?? {}).map(String);
    return { name, kind: "enum", optional, values };
  }

  if (t === "record") return { name, kind: "record", optional };

  if (t === "array") {
    const el = d.element ?? d.valueType;
    const elDef = def(el);
    const elType = elDef?.type;
    if (elType === "string") return { name, kind: "string[]", optional };
    if (elType === "number") return { name, kind: "number[]", optional };
    if (elType === "object" && depth < 2) {
      const shape = shapeOf(el) ?? {};
      return {
        name,
        kind: "object[]",
        optional,
        fields: Object.entries(shape).map(([k, v]) => describe(k, v, depth + 1)),
      };
    }
    return { name, kind: "object[]", optional };
  }

  return { name, kind: "unknown", optional };
}

let cached: ComponentSchema[] | null = null;

/** Every registered component, with its editable props. Sorted by type. */
export function componentSchemas(): ComponentSchema[] {
  if (cached) return cached;

  const out: ComponentSchema[] = [];
  for (const [type, comp] of Object.entries(componentDefinitions as Record<string, any>)) {
    const shape = shapeOf(comp.props) ?? {};
    out.push({
      type,
      description: comp.description,
      slots: comp.slots ?? [],
      props: Object.entries(shape).map(([k, v]) => describe(k, v)),
    });
  }
  out.sort((a, b) => a.type.localeCompare(b.type));
  cached = out;
  return out;
}

/** One component's schema, or undefined when the type is not registered. */
export function componentSchema(type: string): ComponentSchema | undefined {
  return componentSchemas().find((c) => c.type === type);
}

/** True when the component accepts children. */
export function acceptsChildren(type: string): boolean {
  return (componentSchema(type)?.slots.length ?? 0) > 0;
}
