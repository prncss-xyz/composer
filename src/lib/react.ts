import { useMemo, useSyncExternalStore } from "react";
import { selectedStore, Store } from "./stores";
import { eq, Eq, EqReset, Optic } from "./core";
import { uptdateWithOptic } from "./update";
import { isFunction } from "./guards";
import { storeToOptic } from "./utils";

export function useStoreSelect<T, U>(
  store: Store<T>,
  select: (t: T) => U,
  areEqual = Object.is,
) {
  const { subscribe, view, ssr } = useMemo(
    () => selectedStore(store, select, areEqual),
    [areEqual, select, store],
  );
  return useSyncExternalStore(subscribe, view, ssr);
}

export function useStoreValue<V, A, F, C>(
  store: Store<A>,
  factory: Optic<V, A, F, C> | ((o: Eq<A>) => Optic<V, A, F, C>),
  areEqual = Object.is,
) {
  const optic = useMemo(
    () =>
      isFunction(factory) ? (factory(eq()) as Optic<V, A, F, C>) : factory,
    [factory],
  );
  return useStoreSelect(store, optic.select, areEqual);
}

export function useStore<V, A, F, C>(
  store: Store<A>,
  factory: Optic<V, A, F, C> | ((o: EqReset<A>) => Optic<V, A, F, C>),
  areEqual = Object.is,
) {
  const optic = useMemo(
    () =>
      isFunction(factory)
        ? (factory(storeToOptic(store)) as Optic<V, A, F, C>)
        : factory,
    [factory, store],
  );
  return [
    useStoreSelect(store, optic.select, areEqual),
    useMemo(
      () => uptdateWithOptic(optic)(store.update.bind(store)),
      [optic, store],
    ),
  ] as const;
}
