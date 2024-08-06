import { Machine, Sendable } from '../../../composer/dist/machine'
import { MachineStore } from '../../../composer/dist/stores'

export function createMachine<
	State,
	Event extends { type: string },
	Param,
	Final extends State = never,
>(machine: Machine<Event, State, Param, Final>, param: Param) {
	const reducer = machine.send.bind(machine)
	const init = machine.init.bind(machine)
	return new MachineStore<Sendable<Event>, State, Param, Final>(
		reducer,
		param,
		init,
		machine.isFinal,
	)
}
