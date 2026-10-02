import { describe, expect, it } from "vitest";
import { materialize, shallowEqual, signature } from "../src/stable";

const key = (o: Record<string, unknown>) => signature(o).key;

describe("signature: what counts as a change", () => {
  it("plain objects and arrays compare by value, not identity", () => {
    expect(key({ a: { b: [1, 2, { c: "x" }] } })).toBe(key({ a: { b: [1, 2, { c: "x" }] } }));
    expect(key({ a: [1, 2] })).not.toBe(key({ a: [1, 3] }));
    expect(key({ a: { b: 1 } })).not.toBe(key({ a: { b: 2 } }));
  });

  it("undefined properties are the same as absent ones", () => {
    expect(key({ a: 1, b: undefined })).toBe(key({ a: 1 }));
  });

  it("distinguishes types that stringify alike", () => {
    expect(key({ a: 1 })).not.toBe(key({ a: "1" }));
    expect(key({ a: null })).not.toBe(key({ a: "null" }));
    expect(key({ a: true })).not.toBe(key({ a: "true" }));
  });

  it("functions are never compared: a new closure is not a change, but gaining or losing one is", () => {
    expect(key({ f: () => 1 })).toBe(key({ f: () => 2 }));
    expect(key({ f: () => 1 })).not.toBe(key({}));
    expect(key({ o: { f() {} } })).toBe(key({ o: { f: () => 1 } }));
  });

  it("regular expressions compare by source and flags", () => {
    expect(key({ r: /a+/i })).toBe(key({ r: /a+/i }));
    expect(key({ r: /a+/i })).not.toBe(key({ r: /a+/g }));
  });

  it("class instances and DOM-like objects compare by reference", () => {
    class Thing {}
    const t = new Thing();
    expect(key({ t })).toBe(key({ t }));
    expect(key({ t: new Thing() })).not.toBe(key({ t: new Thing() }));
    const el = document.createElement("div");
    expect(key({ el })).toBe(key({ el }));
    expect(key({ el })).not.toBe(key({ el: document.createElement("div") }));
  });

  it("React exotic components and elements are opaque (never cloned)", () => {
    const memoLike = { $$typeof: Symbol.for("react.memo"), type: () => null };
    expect(key({ c: memoLike })).toBe(key({ c: memoLike }));
    expect(key({ c: memoLike })).not.toBe(key({ c: { ...memoLike } }));
    function Klass() {}
    (Klass.prototype as { isReactComponent?: object }).isReactComponent = {};
    expect(key({ c: Klass })).toBe(key({ c: Klass }));
    expect(key({ c: Klass })).not.toBe(key({ c: function Other() {} }));
  });

  it("survives cycles", () => {
    const a: Record<string, unknown> = { n: 1 };
    a.self = a;
    expect(() => key({ a })).not.toThrow();
  });

  it("skips the keys it is told to", () => {
    const skip = new Set(["onChange", "value"]);
    expect(signature({ a: 1, value: "x", onChange: () => 1 }, skip).key).toBe(signature({ a: 1, value: "y" }, skip).key);
  });

  it("collects functions by path", () => {
    const f = () => 1;
    const { fns } = signature({ mentions: { search: f }, plugins: [{ name: "p", setup: f }] });
    expect([...fns.keys()].sort()).toEqual(["mentions.search", "plugins.0.setup"]);
    expect(fns.get("mentions.search")?.fn).toBe(f);
  });
});

describe("materialize: trampolines", () => {
  it("replaces functions by stable ones that call the LATEST function at that path", () => {
    const table = signature({ m: { search: () => "old" } }).fns;
    const copy = materialize({ m: { search: () => "old" } }, table) as { m: { search: () => string } };
    expect(copy.m.search()).toBe("old");
    const latest = signature({ m: { search: () => "new" } }).fns;
    latest.forEach((v, k) => table.set(k, v));
    expect(copy.m.search()).toBe("new");
  });

  it("calls with the original `this` and passes arguments and the return value through", () => {
    const parent = { n: 5, add(x: number) { return this.n + x; } };
    const table = signature({ p: parent }).fns;
    const copy = materialize({ p: parent }, table) as { p: typeof parent };
    expect(copy.p.add(2)).toBe(7);
  });

  it("copies plain structure, leaves non-plain values by reference, and drops undefined", () => {
    const el = document.createElement("i");
    const table = signature({}).fns;
    const out = materialize({ a: { b: [1, { c: 2 }] }, el, gone: undefined }, table) as Record<string, unknown>;
    expect(out).toEqual({ a: { b: [1, { c: 2 }] }, el });
    expect(out.el).toBe(el);
    expect("gone" in out).toBe(false);
  });

  it("does not mutate its input", () => {
    const input = { a: { f: () => 1 } };
    const f = input.a.f;
    materialize(input, new Map());
    expect(input.a.f).toBe(f);
  });
});

describe("shallowEqual", () => {
  it("true only when every key holds the identical value", () => {
    const o = {};
    expect(shallowEqual({ a: 1, o }, { a: 1, o })).toBe(true);
    expect(shallowEqual({ a: 1, o: {} }, { a: 1, o: {} })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(shallowEqual(null, {})).toBe(false);
  });
});
