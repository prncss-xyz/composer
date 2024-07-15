import { FINAL, machine } from './machine'

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
				type: typeof FINAL
				message: 'done'
		  }

	const myMachine = machine<TimerState, TimerEvent>({
		states: {
			running: {
				toggle: ({ now }, { since }) => ({
					type: 'stopped',
					elapsed: since - now,
				}),
				reset: ({ now }) => ({
					type: 'running',
					since: now,
				}),
				bye: () => ({ type: FINAL, message: 'done' }),
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
				bye: () => ({ type: FINAL, message: 'done' }),
			},
		},
	})
	it('should start running', () => {
		const state: TimerState = { type: 'stopped', elapsed: 0 }
		const state2 = myMachine.send({ type: 'toggle', now: 1 }, state)
		expect(state2).toEqual({ type: 'running', since: 1 })
	})
})
