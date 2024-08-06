import { Store } from "../../composer/dist/stores"
import { useSelectStore } from "./lib/stores"

export function Json({ store }: { store: Store<unknown, unknown> }) {
	const json = useSelectStore(store, JSON.stringify)
	return <div>{json}</div>
}
