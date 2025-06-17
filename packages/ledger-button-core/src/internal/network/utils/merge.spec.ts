import { merge } from "./merge.js";

describe("merge", () => {
  it("should merge two objects", () => {
    const target = { a: 1, b: { c: 2, d: 3 } };
    const source = { c: 4, b: { e: 5 } };
    const result = merge(target, source);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3, e: 5 }, c: 4 });
  });
});
