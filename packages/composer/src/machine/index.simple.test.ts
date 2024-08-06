import { simpleMachine } from '.'

describe('machine', () => {
	type Event = {
		type: 'next'
	}
	type State = {
		count: number
	}

	const machine = simpleMachine<Event, State, void, void>({
		init: () => ({ count: 0 }),
		events: {
			next: (_, { count }) => ({ count: count + 1 }),
		},
	})

	it('should start running', () => {
		let store = machine.init()
		store = machine.send('next', store)
		expect(store.state).toEqual({ count: 1 })
	})
})
