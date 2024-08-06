import { Store } from '../../composer/dist/stores'
import { useStoreValue } from './lib/stores'

export function Json({ store }: { store: Store<unknown, unknown> }) {
	const json = useStoreValue(store, JSON.stringify)
	return <div>{json}</div>
}
