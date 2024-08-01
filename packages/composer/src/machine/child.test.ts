import { machine } from '.'
import { sumMachine } from './sum'

type Event = {
	type: 'next'
}

type PreparationState =
	| {
			type: 'weighting'
	  }
	| {
			type: 'grinding'
	  }
	| {
			type: 'final'
	  }

type PreparationGetters = {
	toWait: () => number
}

const preparationMachine = machine<
	Event,
	PreparationState,
	void,
	PreparationGetters
>({
	init: () => ({ type: 'weighting' }),
	states: {
		weighting: {
			on: { next: () => ({ type: 'grinding' }) },
			getters: {
				toWait: () => () => 3,
			},
		},
		grinding: {
			on: { next: () => ({ type: 'final' }) },
			getters: {
				toWait: () => () => 2,
			},
		},
	},
})

type EspressoState =
	| {
			type: 'brewing'
	  }
	| {
			type: 'final'
			message: string
	  }

type EspressoGetters = {
	toWait: () => number
}

const espressoMachine = machine<Event, EspressoState, void, EspressoGetters>({
	init: () => ({ type: 'brewing' }),
	states: {
		brewing: {
			on: { next: () => ({ type: 'final', message: 'coffee ready' }) },
			getters: {
				toWait: () => () => 1,
			},
		},
	},
})

const coffeeMachine = sumMachine(
	preparationMachine,
	espressoMachine,
	() => ({
		type: 'left',
		state: preparationMachine.init(),
	}),
	(state) =>
		state.type === 'left'
			? { type: 'right', state: espressoMachine.init() }
			: state,
)

describe('child machine', () => {
	test('sequence', () => {
		let state = coffeeMachine.init()
		const toWait = coffeeMachine.getter('toWait')
		expect(state).toEqual({ type: 'left', state: { type: 'weighting' } })
		expect(toWait(state)).toBe(3)
		state = coffeeMachine.send({ type: 'next' }, state)
		expect(state).toEqual({ type: 'left', state: { type: 'grinding' } })
		expect(toWait(state)).toBe(2)
		state = coffeeMachine.send({ type: 'next' }, state)
		expect(state).toEqual({ type: 'right', state: { type: 'brewing' } })
		expect(toWait(state)).toBe(1)
		state = coffeeMachine.send({ type: 'next' }, state)
		expect(state).toEqual({
			type: 'right',
			state: { type: 'final', message: 'coffee ready' },
		})
	})
})
