import { eq } from "./core";
import { getterOpt, getter } from "./core-getters";
import { flow } from "./flow";
import { at, prop, to } from "./optics";

export function toOpt2<B, V>(f: (v: V) => B | undefined) {
  return getterOpt<B, V>({
    select: f,
  });
}

export function to2<B, V>(f: (v: V) => B) {
  return getter<B, V>({
    select: f,
  });
}

const x = [1, 2, 3];
const k = flow(eq<number[]>(), at(1));

const p = {
  a: {
    b: true,
    c: [{ d: "caca" }],
    x: [1, 2, 3],
  },
};
type P = typeof p;

const res = flow(
  eq<P>(),
  prop("a"),
  prop("x"),
  to((x) => x.length),
);

const res2 = flow(
  eq<P>(),
  prop("a"),
  prop("x"),
  to2((x) => x.length),
);
console.log(res, res2);
