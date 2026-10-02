/**
 * Identity-free option comparison, so users never have to memoise what they pass.
 *
 * The rule, in one paragraph:
 *   plain objects and arrays are compared by VALUE (deeply); functions are never compared, they
 *   are replaced by stable trampolines that always call the LATEST function with the same path;
 *   regular expressions are compared by source and flags; anything else (class instances, DOM
 *   nodes, React elements and exotic components, Map/Set) is compared by REFERENCE.
 *
 * So `plugins={[callout()]}` or `mentions={{ search: (q) => load(q) }}` written inline does not
 * recreate the editor on every render, while `layout="bottom-bar"` becoming `"classic"` does.
 */

export type FnEntry = { fn: (...args: unknown[]) => unknown; self: unknown };
/** Latest function at each path, refreshed on every commit. Trampolines read it at call time. */
export type FnTable = Map<string, FnEntry>;

export type Signature = { key: string; fns: FnTable };

let nextId = 1;
const ids = new WeakMap<object, number>();
const idOf = (o: object): number => {
  let n = ids.get(o);
  if (n === undefined) ids.set(o, (n = nextId++));
  return n;
};

const isPlain = (v: object): boolean => {
  const p = Object.getPrototypeOf(v);
  return p === Object.prototype || p === null;
};

/** React components that must keep their identity: class components and exotic ones (memo, forwardRef…). */
const isOpaqueFn = (f: { prototype?: { isReactComponent?: unknown } }): boolean => !!f.prototype?.isReactComponent;

type Walk = { clone: boolean; table: FnTable; out: string[]; ancestors: object[] };

function walk(v: unknown, path: string, self: unknown, w: Walk): unknown {
  switch (typeof v) {
    case "undefined":
      return undefined;
    case "function": {
      if (isOpaqueFn(v as never)) {
        w.out.push("#" + idOf(v as object));
        return v;
      }
      w.out.push("ƒ");
      if (!w.clone) {
        w.table.set(path, { fn: v as FnEntry["fn"], self });
        return undefined;
      }
      // `this` is the original parent, as it would have been when the function was called directly.
      return function (this: unknown, ...args: unknown[]) {
        const e = w.table.get(path);
        return e ? e.fn.apply(e.self ?? this, args) : undefined;
      };
    }
    case "object": {
      if (v === null) {
        w.out.push("null");
        return null;
      }
      const o = v as object;
      if (o instanceof RegExp) {
        w.out.push("/" + o.source + "/" + o.flags);
        return o;
      }
      const arr = Array.isArray(o);
      if (
        (!arr && !isPlain(o)) ||
        "$$typeof" in o ||
        w.ancestors.includes(o) // a cycle: treat the node as opaque rather than loop
      ) {
        w.out.push("#" + idOf(o));
        return o;
      }
      w.ancestors.push(o);
      let res: unknown;
      if (arr) {
        w.out.push("[");
        const copy: unknown[] = w.clone ? [] : (null as never);
        (o as unknown[]).forEach((item, i) => {
          const c = walk(item, path + "." + i, o, w);
          w.out.push(",");
          if (w.clone) copy.push(c);
        });
        w.out.push("]");
        res = copy;
      } else {
        w.out.push("{");
        const copy: Record<string, unknown> | null = w.clone ? {} : null;
        for (const k of Object.keys(o)) {
          const item = (o as Record<string, unknown>)[k];
          if (item === undefined) continue; // `{ a: undefined }` equals `{}`
          w.out.push(JSON.stringify(k) + ":");
          const c = walk(item, path + "." + k, o, w);
          w.out.push(",");
          if (copy) copy[k] = c;
        }
        w.out.push("}");
        res = copy;
      }
      w.ancestors.pop();
      return res;
    }
    case "string":
      w.out.push(JSON.stringify(v));
      return v;
    case "bigint":
      w.out.push(String(v) + "n");
      return v;
    default:
      w.out.push(String(v));
      return v;
  }
}

/** The structural key of `input` and the functions it holds, by path. No allocation of a copy. */
export function signature(input: Record<string, unknown>, skip?: ReadonlySet<string>): Signature {
  const w: Walk = { clone: false, table: new Map(), out: [], ancestors: [] };
  for (const k of Object.keys(input)) {
    if (skip?.has(k) || input[k] === undefined) continue;
    w.out.push(k + "=");
    walk(input[k], k, input, w);
    w.out.push(";");
  }
  return { key: w.out.join(""), fns: w.table };
}

/** A deep copy of `input` whose functions are trampolines into `table`. */
export function materialize(input: Record<string, unknown>, table: FnTable, skip?: ReadonlySet<string>): Record<string, unknown> {
  const w: Walk = { clone: true, table, out: [], ancestors: [] };
  const res: Record<string, unknown> = {};
  for (const k of Object.keys(input)) {
    if (skip?.has(k) || input[k] === undefined) continue;
    res[k] = walk(input[k], k, input, w);
  }
  return res;
}

/** Every own key of `a` and `b` holds the same value (`Object.is`): nothing can have changed. */
export function shallowEqual(a: Record<string, unknown> | null, b: Record<string, unknown>): boolean {
  if (a === b) return true;
  if (!a) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false;
  return true;
}
