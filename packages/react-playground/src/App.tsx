import { clock, useClock } from './clock'
import { createMachine, useMachine } from './machine'
import { timerMachine } from './timer'

const timer = createMachine(timerMachine, undefined)

function Toggle() {
	const toggle = useMachine.send(timer, () => ({
		type: 'toggle',
		now: clock.peek(),
	}))
	const running = useMachine.get(timer, (state) => state.type === 'running')
	return <button onClick={toggle}>{running ? 'Stop' : 'Start'}</button>
}

function Reset() {
	const reset = useMachine.send(timer, () => ({
		type: 'reset',
		now: clock.peek(),
	}))
	return <button onClick={reset}>Reset</button>
}

function Counter() {
	const state = useMachine.get(timer, (state) => state)
	const seconds = useClock((now) => {
		const count = state.type === 'running' ? now - state.since : state.elapsed
		return Math.floor(count / 1000)
	})
	return <div>{seconds}</div>
}

export default function App() {
	return (
		<div>
			<Toggle />
			<Reset />
			<Counter />
		</div>
	)
}
