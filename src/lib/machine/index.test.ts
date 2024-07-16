import { machine } from './machine'

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
		| {
				type: 'final'
				message: 'done'
		  }

	const timerMachine = machine<TimerState, TimerEvent>({
		init: () => ({ type: 'stopped', elapsed: 0 }),
		states: {
			running: {
				toggle: ({ now }, { since }) => ({
					type: 'stopped',
					elapsed: now - since,
				}),
				reset: ({ now }) => ({
					type: 'running',
					since: now,
				}),
				bye: () => ({ type: 'final', message: 'done' }),
			},
			stopped: {
				toggle: ({ now }, { elapsed }) => ({
					type: 'running',
					since: now - elapsed,
				}),
				reset: () => ({
					type: 'stopped',
					elapsed: 0,
				}),
				bye: () => ({ type: 'final', message: 'done' }),
			},
		},
	})

	it('should start running', () => {
		let state: TimerState = timerMachine.init()
		state = timerMachine.send({ type: 'toggle', now: 1 }, state)
		expect(state).toEqual({ type: 'running', since: 1 })
		state = timerMachine.send({ type: 'toggle', now: 3 }, state)
		expect(state).toEqual({ type: 'stopped', elapsed: 2 })
		state = timerMachine.send({ type: 'reset', now: 6 }, state)
		expect(state).toEqual({ type: 'stopped', elapsed: 0 })
		state = timerMachine.send({ type: 'toggle', now: 9 }, state)
		state = timerMachine.send({ type: 'reset', now: 11 }, state)
		state = timerMachine.send({ type: 'toggle', now: 11 }, state)
		expect(state).toEqual({ type: 'stopped', elapsed: 0 })
	})
})
