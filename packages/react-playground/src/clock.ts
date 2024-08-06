import { StateStore } from '../../composer/dist/stores'
import { useSyncSelect } from './machine'

const period = 100

class Clock extends StateStore<number> {
	constructor() {
		super(0)
		setInterval(() => {
			this.acc = Date.now()
			this.notify()
		}, period)
	}
}

export const clock = new Clock()

export function useClock<T>(select: (now: number) => T) {
	return useSyncSelect(
		select,
		Object.is,
		clock.subscribe.bind(clock),
		clock.peek.bind(clock),
		clock.peek.bind(clock),
	)
}
