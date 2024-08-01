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

	type TimerGetters = {
		count: (now: number) => number
	}

	const timerMachine = machine<TimerEvent, TimerState, void, TimerGetters>({
		init: () => ({ type: 'stopped', elapsed: 0 }),
		states: {
			running: {
				on: {
					toggle: ({ now }, { since }) => ({
						type: 'stopped',
						elapsed: now - since,
					}),
					reset: ({ now }) => ({
						type: 'running',
						since: now,
					}),
				},
				getters: {
					count:
						({ since }) =>
						(now) =>
							now - since,
				},
			},
			stopped: {
				on: {
					toggle: ({ now }, { elapsed }) => ({
						type: 'running',
						since: now - elapsed,
					}),
					reset: () => ({
						type: 'stopped',
						elapsed: 0,
					}),
				},
				getters: {
					count:
						({ elapsed }) =>
						() =>
							elapsed,
				},
			},
		},
	})

	it('should start running', () => {
		let state = timerMachine.init()
		const count = timerMachine.getter('count')
		state = timerMachine.send({ type: 'toggle', now: 1 }, state)
		expect(state).toEqual({ type: 'running', since: 1 })
		expect(count(state)(3)).toBe(2)
		state = timerMachine.send({ type: 'toggle', now: 3 }, state)
		expect(count(state)(3)).toBe(2)
		expect(state).toEqual({ type: 'stopped', elapsed: 2 })
		state = timerMachine.send({ type: 'reset', now: 6 }, state)
		expect(state).toEqual({ type: 'stopped', elapsed: 0 })
		state = timerMachine.send({ type: 'toggle', now: 9 }, state)
		state = timerMachine.send({ type: 'reset', now: 11 }, state)
		state = timerMachine.send({ type: 'toggle', now: 11 }, state)
		expect(state).toEqual({ type: 'stopped', elapsed: 0 })
	})
})
