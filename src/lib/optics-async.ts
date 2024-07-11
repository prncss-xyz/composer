import { flow } from "./flow";
import { REMOVE } from "./guards";

type OpticSchema<V, A, F, C> = {
  select: (a: A, succ: (v: V) => void, fail: (f: F) => void) => void;
  reduce: (v: V, a: A, succ: (a: A) => void) => void;
  exec: (c: C, a: A, succ: (a: A) => void) => void;
};

function compose<V, A, F1, C1, B, F2, C2>(
  p: OpticSchema<V, A, F1, C1>,
  q: OpticSchema<B, V, F2, C2>,
): OpticSchema<B, A, F1 | F2, C2> {
  return {
    select: (a, succ, fail) => {
      p.select(
        a,
        (v) => {
          q.select(v, succ, fail);
        },
        fail,
      );
    },
    reduce: (b, a, succ) => {
      p.select(
        a,
        (v) => {
          q.reduce(b, v, (v) => {
            p.reduce(v, a, succ);
          });
        },
        () => succ(a),
      );
    },
    exec: (c, a, succ) => {
      p.select(
        a,
        (v) => {
          q.exec(c, v, (v) => {
            p.reduce(v, a, succ);
          });
        },
        () => succ(a),
      );
    },
  };
}

function eq<T>(): OpticSchema<T, T, never, never> {
  return {
    select: (a, succ) => {
      succ(a);
    },
    reduce: (b, _a, succ) => {
      succ(b);
    },
    exec: () => {},
  };
}

function prop<K extends keyof V, V>(b: K) {
  return function <A, RE1, C1>(
    p: OpticSchema<V, A, RE1, C1>,
  ): OpticSchema<V[K], A, RE1, never> {
    return compose(p, {
      select: (v, succ) => {
        succ(v[b]);
      },
      reduce: (c, v, succ) => {
        succ({ ...v, [b]: c });
      },
      exec: () => {},
    });
  };
}


function at<X>(b: number) {
  return function <A, RE1, C1>(
    p: OpticSchema<X[], A, RE1, C1>,
  ): OpticSchema<X, A, RE1 | undefined, typeof REMOVE> {
    return compose(p, {
      select: (xs, succ, fail) => {
        const x = xs.at(b);
        if (x === undefined) fail(undefined);
        else succ(x);
      },
      reduce: (c, xs, succ) => {
        succ(xs.with(b, c));
      },
      exec: (_c, xs, succ) => {
        succ(xs.toSpliced(b));
      },
    });
  };
}

const p = {
  a: {
    b: true,
    c: [{ d: "caca" }],
  },
};
type P = typeof p;

const x = flow(eq<P>(), prop("a"), prop("c"), at(1), prop("d"));
