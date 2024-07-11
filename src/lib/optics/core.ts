import { isFunction } from "../guards";
import { fromInit, id, Init } from "../utils";

function isNever(v: unknown): v is never {
  return false;
}

function isUndefined(v: unknown) {
  return v === undefined;
}

export const RESET = Symbol("RESET");
function isReset(v: unknown) {
  return v === RESET;
}

export const REMOVE = Symbol("REMOVE");
function isRemove(v: unknown) {
  return v === REMOVE;
}

function forbidden<T, U>(_: T, _u: U): U {
  throw new Error("this is a getter only optic, don not use a setter");
}

function inert<T, U>(_: T, u: U) {
  return u;
}

export type Optic<V, A, F, C> = {
  select: (a: A) => V | F;
  isFaillure: (v: unknown) => v is F;
  reduce: (v: V, a: A) => A;
  isCommand: (v: unknown) => v is C;
  exec: (c: C, a: A) => A;
};

function compose<V, A, F1, C1, B, F2, C2>(
  p: Optic<V, A, F1, C1>,
  q: Optic<B, V, F2, C2>,
): Optic<B, A, F1 | F2, C2> {
  const isFaillure =
    p.isFaillure === isNever
      ? q.isFaillure
      : p.isFaillure === isUndefined && q.isFaillure === isUndefined
        ? (isUndefined as (v: unknown) => v is F1 | F2)
        : (v: unknown) => p.isFaillure(v) || q.isFaillure(v);
  return {
    select: (a) => {
      const t = p.select(a);
      if (p.isFaillure(t)) return t;
      return q.select(t);
    },
    isFaillure,
    reduce: (b, a) => {
      const t = p.select(a);
      if (p.isFaillure(t)) return a;
      return p.reduce(q.reduce(b, t), a);
    },
    isCommand: q.isCommand,
    exec: (c, a) => {
      const t = p.select(a);
      if (p.isFaillure(t)) return a;
      return p.reduce(q.exec(c, t), a);
    },
  };
}

export function view<V, A, F, C>(o: Optic<V, A, F, C>, a: A) {
  return o.select(a);
}

export function put<V, A, F, C>(o: Optic<V, A, F, C>, v: V, a: A) {
  return o.reduce(v, a);
}

export function command<V, A, F, C>(o: Optic<V, A, F, C>, c: C, a: A) {
  return o.exec(c, a);
}

export function modify<V, A, F, C>(o: Optic<V, A, F, C>, f: (v: V) => V, a: A) {
  const v = o.select(a);
  if (o.isFaillure(v)) return a;
  return o.reduce(f(v), a);
}

export function update<V, A, F, C>(
  p: Optic<V, A, F, C>,
  arg: C | V | ((v: V) => V),
  a: A,
) {
  if (p.isCommand(arg)) return a;
  if (isFunction(arg)) return modify(p, arg, a);
  return put(p, arg, a);
}

export type Eq<T> = Optic<T, T, never, never>;
export function eq<T>(): Eq<T> {
  return {
    select: id,
    isFaillure: isNever,
    reduce: id,
    isCommand: isNever,
    exec: inert,
  };
}

export type EqReset<T> = Optic<T, T, never, typeof RESET>;
export function eqReset<T>(value: Init<T>): EqReset<T> {
  return {
    ...eq<T>(),
    isCommand: isReset,
    exec: () => fromInit(value),
  };
}

// ideally, typesystem whould reject any use of reduce instead of making it inert
// defective

export function getter<B, V>({ select }: { select: (v: V) => B }) {
  return lens<B, V>({
    select,
    reduce: forbidden,
  });
}

export function getterOpt<B, V>({
  select,
}: {
  select: (v: V) => B | undefined;
}) {
  return optional<B, V>({
    select,
    reduce: forbidden,
  });
}

export function lens<B, V>({
  select,
  reduce,
}: {
  select: (v: V) => B;
  reduce: (b: B, v: V) => V;
}) {
  return function <A, F1, C>(p: Optic<V, A, F1, C>): Optic<B, A, F1, never> {
    return compose(p, {
      select,
      isFaillure: isNever,
      reduce,
      isCommand: isNever,
      exec: inert,
    });
  };
}

export function optional<B, V>({
  select,
  reduce,
}: {
  select: (v: V) => B | undefined;
  reduce: (b: B, v: V) => V;
}) {
  return function <A, F1, C>(
    p: Optic<V, A, F1, C>,
  ): Optic<B, A, F1 | undefined, never> {
    return compose(p, {
      select,
      isFaillure: isUndefined,
      reduce,
      isCommand: isNever,
      exec: inert,
    });
  };
}

export function removable<B, V>({
  select,
  reduce,
  remove,
}: {
  select: (v: V) => B | undefined;
  reduce: (b: B, v: V) => V;
  remove: (v: V) => V;
}) {
  return function <A, F1, C>(
    p: Optic<V, A, F1, C>,
  ): Optic<B, A, F1 | undefined, typeof REMOVE> {
    return compose(p, {
      select,
      isFaillure: isUndefined,
      reduce,
      isCommand: isRemove,
      exec: (_, a) => remove(a),
    });
  };
}
