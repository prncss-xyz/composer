import { machine } from '../../composer/dist/machine'

type TimerEvent =
	| { type: 'toggle'; now: number }
	| { type: 'reset'; now: number }

export type TimerState =
	| { type: 'running'; since: number }
	| { type: 'stopped'; elapsed: number }

type TimerGetters = { count: (now: number) => number }

export const timerMachine = machine<TimerEvent, TimerState, void, TimerGetters>(
	{
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
	},
)
