import { Json } from '@/json'

import { createMachine } from '../lib/machines'
import { useSetStore, useStoreValue } from '../lib/stores'
import { clock, useSetupClock } from './clock'
import { timerMachine } from './timer'

const timer = createMachine(timerMachine, undefined)

function Toggle() {
	const toggle = useSetStore(timer, () => ({
		type: 'toggle' as const,
		now: clock.peek(),
	}))
	const running = useStoreValue(timer, ({ state }) => state.type === 'running')
	return <button onClick={toggle}>{running ? 'Stop' : 'Start'}</button>
}

function Reset() {
	const reset = useSetStore(timer, () => ({
		type: 'reset' as const,
		now: clock.peek(),
	}))

	return <button onClick={reset}>Reset</button>
}

function Counter() {
	const count = useStoreValue(timer, ({ context }) => context.count)
	const seconds = useStoreValue(clock, (now) => Math.floor(count(now) / 1000))
	return <div>{seconds}</div>
}

export default function TimerDemo() {
	useSetupClock()
	return (
		<div>
			<Toggle />
			<Reset />
			<Counter />
			<Json store={timer} />
			<Json store={clock} />
		</div>
	)
}
