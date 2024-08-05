import { machine } from '../../composer/dist/machine'

type Event = { type: 'toggle'; now: number } | { type: 'reset'; now: number }

export type State =
	| { type: 'running'; since: number }
	| { type: 'stopped'; elapsed: number }

type Context = { count: (now: number) => number }

export const timerMachine = machine<Event, State, Context>({
	init: () => ({ type: 'stopped', elapsed: 0 }),
	states: {
		running: {
			events: {
				toggle: ({ now }, _, { count }) => ({
					type: 'stopped',
					elapsed: count(now),
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
				toggle: ({ now }, _, { count }) => ({
					type: 'running',
					since: now - count(now),
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
