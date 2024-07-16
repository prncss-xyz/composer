import { Optic } from "./optics/core"

export type SetStateAction<S> = S | ((prevState: S) => S)
type DispatchUpdate<T> = (s: SetStateAction<T>) => void
type DispatchPut<T> = (s: T) => void

export function update<V, A, F, C>({
	select,
	isFaillure,
	reduce,
	isCommand,
	exec,
}: Optic<V, A, F, C>) {
	return function (t: SetStateAction<V> | C) {
		if (isCommand(t)) {
			return (s: A) => exec(t, s)
		}
		if (isFunction(t)) {
			return (s: A) => {
				const next = select(s)
				if (isFaillure(next)) return s
				return reduce(next, s)
			}
		}
		return (s: A) => reduce(t, s)
	}
}

export function uptdateWithOptic<V, A, F, C>(opt: Optic<V, A, F, C>) {
	return function (dispatch: DispatchUpdate<A>): DispatchUpdate<V> {
		return function (t: SetStateAction<V>) {
			dispatch(update(opt)(t))
		}
	}
}

// todo: withDebounce, withThrottle

type Reducer<T, S> = {
	init: S
	reduce: (t: T, s: S) => S
}

// What is th edifference between this and rewriteUpdate?
export function setWithReducer<T, S>({ init, reduce }: Reducer<T, S>) {
	return function (dispatch: DispatchPut<S>): DispatchPut<T> {
		let acc = init
		return function (t) {
			acc = reduce(t, acc)
			dispatch(acc)
		}
	}
}
