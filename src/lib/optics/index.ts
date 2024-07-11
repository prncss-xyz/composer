import {
  lens,
  removable,
  optional,
  Optic,
  getter,
  getterOpt,
  REMOVE,
} from "./core";
import { fromInit, id, Init } from "../utils";

type OptionalKeys<T> = {
  [K in keyof T]: object extends Pick<T, K> ? K : never;
}[keyof T];

// isomorphisms

// ideally, typesystem whould reject any use of reduce instead of making it inert
// defective
export function to<B, V>(select: (v: V) => B) {
  return getter<B, V>({
    select,
  });
}

// impure
export function log<V>(message = "") {
  return lens<V, V>({
    select: (v) => {
      console.log(message, "reading", v);
      return v;
    },
    reduce: (b, v) => {
      console.log(message, "writing", b, v);
      return b;
    },
  });
}

export function reread<A>(f: (a: A) => A) {
  return lens<A, A>({
    select: f,
    reduce: id,
  });
}

export function rewrite<A>(f: (next: A, last: A) => A) {
  return lens<A, A>({
    select: id,
    reduce: f,
  });
}

export function entries<T>() {
  return lens({
    select: (o: Record<string, T>) => Object.entries(o),
    reduce: (entries) => Object.fromEntries(entries),
  });
}

export function indexed<T>() {
  return lens({
    select: (xs: T[]) => xs.map((v, i) => [i, v] as const),
    reduce: (entries: (readonly [number, T])[]) => {
      const res: T[] = [];
      for (const [index, value] of entries) {
        res[index] = value;
      }
      return res;
    },
  });
}

export function split(separator = ",") {
  return lens<string[], string>({
    select: (str) => str.split(separator),
    reduce: (xs) => {
      return xs.join(separator);
    },
  });
}

export function linear(m: number, b = 0) {
  return lens<number, number>({
    select: (x) => m * x + b,
    reduce: (y) => (y - b) / m,
  });
}

// lenses

export function filter<X>(p: (x: X) => unknown) {
  return lens({
    select: (xs: X[]) => xs.filter(p),
    reduce: (fs: X[], xs: X[]) => {
      const rs = [];
      let i = 0;
      let j = 0;
      let k = 0;
      for (i = 0; i < xs.length; i++) {
        const x = xs[i];
        if (p(x)) {
          if (j < fs.length) {
            rs[k++] = fs[j++];
          }
        } else {
          rs[k++] = x;
        }
      }
      for (; j < fs.length; j++, i++) {
        rs[k++] = fs[j];
      }
      return rs;
    },
  });
}

// equivalendce relation
export function includes<X>(x: X) {
  return lens<boolean, X[]>({
    select: (xs) => xs.includes(x),
    reduce: (v, xs) => {
      if (xs.includes(x) === v) return xs;
      if (v) return [...xs, x];
      return xs.filter((x_) => x_ !== x);
    },
  });
}

/// tuples
export function nth<
  V,
  T extends [
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    V,
    ...unknown[],
  ],
>(i: 6): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<
  V,
  T extends [unknown, unknown, unknown, unknown, unknown, V, ...unknown[]],
>(i: 5): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<
  V,
  T extends [unknown, unknown, unknown, unknown, V, ...unknown[]],
>(i: 4): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<V, T extends [unknown, unknown, unknown, V, ...unknown[]]>(
  i: 3,
): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<V, T extends [unknown, unknown, V, ...unknown[]]>(
  i: 2,
): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<V, T extends [unknown, V, ...unknown[]]>(
  i: 1,
): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<V, T extends [V, ...unknown[]]>(
  i: 0,
): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<V, A, F1, never>;
export function nth<T extends unknown[]>(
  i: number,
): <A, F1, C>(p: Optic<T, A, F1, C>) => Optic<unknown, A, F1, never>;
export function nth<T extends unknown[]>(i: number) {
  return lens<unknown, T>({
    select: (o) => o[i],
    reduce: (v, o) => o.with(i, v) as T,
  });
}

// prisms

export function when<V>(p: (v: V) => unknown) {
  return optional<V, V>({
    select: (v) => (p(v) ? v : undefined),
    reduce: id,
  });
}

export function guard<V, W extends V>(p: (v: V) => v is W) {
  return optional<W, V>({
    select: (v) => (p(v) ? v : undefined),
    reduce: id,
  });
}

export function strToNum() {
  return optional({
    select: (s: string) => {
      const num = Number(s);
      if (isNaN(num)) return undefined;
      return num;
    },
    reduce: (n) => String(n),
  });
}

export function toOpt<B, V>(select: (v: V) => B | undefined) {
  return getterOpt<B, V>({
    select,
  });
}

export function firstOf<A, V, F>(optics: Optic<V, A, F, never>[]) {
  return toOpt<V, A>((a: A) => {
    for (const { select, isFaillure } of optics) {
      const v = select(a);
      if (isFaillure(v)) continue;
      return v;
    }
    return undefined;
  });
}

export function construct<
  A,
  V,
  F,
  K extends string | number | symbol,
  T extends Record<K, Optic<V, A, F, never>>,
>(optics: T) {
  return toOpt<V, A>((a: A) => {
    const res: Record<string, unknown> = {};
    for (const [key, { select, isFaillure }] of Object.entries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      optics as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any) {
      const v = select(a);
      if (isFaillure(v)) return undefined;
      res[key] = v;
    }
    return res as any; // TODO: map T to final type
  });
}

// removables

export function prop<Key extends keyof O, O>(
  key: Key,
): <A, F1, C>(
  p: Optic<O, A, F1, C>,
) => Optic<
  O[Key],
  A,
  F1 | Key extends OptionalKeys<O> ? undefined : never,
  Key extends OptionalKeys<O> ? typeof REMOVE : never
>;
export function prop<Key extends keyof O, O>(key: Key) {
  return removable<O[Key], O>({
    select: (o) => o[key],
    reduce: (v, o) => ({ ...o, [key]: v }),
    remove: (o) => {
      const res = { ...o };
      delete res[key];
      return res;
    },
  });
}

export function at<X>(b: number) {
  return removable<X, X[]>({
    select: (xs) => xs.at(b),
    reduce: (x: X, xs) => xs.with(b, x),
    remove: (xs) => xs.toSpliced(b),
  });
}

export function find<X>(p: (x: X) => unknown) {
  return removable({
    select: (xs: X[]) => xs.find(p),
    reduce: (x: X, xs: X[]) => {
      const i = xs.findIndex(p);
      if (i < 0) return [...xs, x];
      xs = [...xs];
      xs[i] = x;
      return xs;
    },
    remove: (xs: X[]) => {
      const i = xs.findIndex(p);
      if (i < 0) return xs;
      const r = xs.slice(0, i);
      r.push(...xs.slice(i + 1));
      return r;
    },
  });
}

export function tail<X>() {
  return removable<X[], X[]>({
    select: (last) => (last.length ? last.slice(1) : undefined),
    reduce: (next, last) => (last.length ? [last[0], ...next] : last),
    remove: (last) => (last.length ? last.slice(1) : last),
  });
}

// defective
// aka prepend
export function head<X>() {
  return removable<X, X[]>({
    select: (xs) => xs.at(0),
    reduce: (x, xs) => [x, ...xs],
    remove: (xs) => xs.slice(1),
  });
}

// defective
// aka append
export function foot<X>() {
  return removable<X, X[]>({
    select: (xs) => xs.at(-1),
    reduce: (x, xs) => [...xs, x],
    remove: (xs) => xs.slice(0, -1),
  });
}
