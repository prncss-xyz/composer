import { isFunction } from "./guards";
import { eqReset } from "./optics/core";
import { Store } from "./stores";

export function id<T>(t: T) {
  return t;
}

export type Init<T> = T | (() => T);
export function fromInit<T>(init: Init<T>): T {
  return isFunction(init) ? init() : init;
}

export function storeToOptic<V>(store: Store<V>) {
  return eqReset(() => store.initial());
}
