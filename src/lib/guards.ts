
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction<T>(x: T): x is T & ((...args: any[]) => any) {
  return typeof x === "function";
}
