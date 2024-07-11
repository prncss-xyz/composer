import { at } from ".";
import { flow } from "../flow";
import { eq, modify, put, view } from "./core";

describe("at", () => {
  type Source = string[];
  const sourceDefined: Source = ["foo", "bar", "baz", "quux"];
  const sourceUndefined: Source = ["foo"];
  const mod = (x: string) => `${x} UPDATED`;
  const prism = flow(eq<Source>(), at(1));

  it("view undefined", () => {
    expect(view(prism, sourceUndefined)).toBeUndefined();
  });
  it("view defined", () => {
    expect(view(prism, sourceDefined)).toBe("foo");
  });
  it("put undefined", () => {
    expect(put(prism, "UPDATED", sourceUndefined)).toBe("UPDATED");
  });
  it("put defined", () => {
    expect(put(prism, "UPDATED", sourceDefined)).toBe("UPDATED");
  });
  it("modify undefined", () => {
    expect(modify(prism, mod, sourceUndefined)).toEqual([
      "foo",
      "bar UPDATED",
      "baz",
      "quux",
    ]);
  });
  it("modigy defined", () => {
    expect(modify(prism, mod, sourceDefined)).toBe("foo UPDATED");
  });
});
