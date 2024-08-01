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

	const timerMachine = machine<TimerEvent, TimerState>({
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
			},
		},
	})

	test('can ommit getters when it is empty', () => {})
})
