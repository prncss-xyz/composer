import { ChildMachine, ChildState, machine } from '.'

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
			message: string
	  }

const preparationMachine = machine<PreparationState, Event>({
	init: () => ({ type: 'weighting' }),
	states: {
		weighting: {
			next: () => ({ type: 'grinding' }),
		},
		grinding: {
			next: () => ({ type: 'final', message: 'done' }),
		},
	},
})

type CoffeeState =
	| { type: 'iddle' }
	| ChildState<'preparing', PreparationState>
	| { type: 'brewing' }

const coffeeMachine = machine<CoffeeState, Event>({
	init: () => ({ type: 'iddle' }),
	states: {
		iddle: {
			next: () => ({ type: 'preparing', state: preparationMachine.init() }),
		},
		preparing: {},
		brewing: {},
	},
})
