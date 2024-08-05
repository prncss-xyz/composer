import { machine } from '.'

describe('machine', () => {
	type TimerEvent =
		| {
				type: 'toggle'
				now: number
		  }
		| {
				type: 'reset'
				now: number
		  }
		| { type: 'bye' }

	type TimerState =
		| {
				type: 'running'
				since: number
		  }
		| {
				type: 'stopped'
				elapsed: number
		  }

	type TimerContext = {
		count: (now: number) => number
	}

	const timerMachine = machine<TimerEvent, TimerState, TimerContext, void>({
		init: () => ({ type: 'stopped', elapsed: 0 }),
		states: {
			running: {
				events: {
					toggle: ({ now }, { since }) => ({
						type: 'stopped',
						elapsed: now - since,
					}),
					reset: ({ now }) => ({
						type: 'running',
						since: now,
					}),
				},
				context: ({ since }) => ({
					count: (now: number) => now - since,
				}),
			},
			stopped: {
				events: {
					toggle: ({ now }, { elapsed }) => ({
						type: 'running',
						since: now - elapsed,
					}),
					reset: () => ({
						type: 'stopped',
						elapsed: 0,
					}),
				},
				context: ({ elapsed }) => ({
					count: () => elapsed,
				}),
			},
		},
	})

	it('should start running', () => {
		let store = timerMachine.init()
		store = timerMachine.send({ type: 'toggle', now: 1 }, store)
		expect(store.state).toEqual({ type: 'running', since: 1 })
		expect(store.context.count(3)).toBe(2)
		store = timerMachine.send({ type: 'toggle', now: 3 }, store)
		expect(store.context.count(3)).toBe(2)
		expect(store.state).toEqual({ type: 'stopped', elapsed: 2 })
		store = timerMachine.send({ type: 'reset', now: 6 }, store)
		expect(store.state).toEqual({ type: 'stopped', elapsed: 0 })
		store = timerMachine.send({ type: 'toggle', now: 9 }, store)
		store = timerMachine.send({ type: 'reset', now: 11 }, store)
		store = timerMachine.send({ type: 'toggle', now: 11 }, store)
		expect(store.state).toEqual({ type: 'stopped', elapsed: 0 })
	})
})
