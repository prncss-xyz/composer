import { Json } from '@/json'
import { createAtom } from '@/lib/atoms'
import { useActiveFocus, useFocus } from '@/lib/foci'
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { eq, filter, includes, prop } from '../../../composer/dist/optics'
import { flow } from '../../../composer/dist/utils'

function isVoyel(s: string) {
	return 'aeiouy'.includes(s)
}
const names = ['a', 'b', 'c', 'd', 'e']
type State = {
	fields: {
		contents: string[]
	}
}
const atom = createAtom<State>({ fields: { contents: [] } })

const items = flow(eq<State>(), prop('fields'), prop('contents'))
const voyelsItems = filter(isVoyel)(items)
/* const voyelsItems = flow(items, filter(isVoyel)) */
const getItem = (s: string) => includes(s)(items)

const toggle = (v: boolean) => !v

function Checkbox({
	name,
	value,
	setValue,
}: {
	name: string
	value: boolean
	setValue: Dispatch<SetStateAction<boolean>>
}) {
	const onChange = useCallback(() => setValue(toggle), [setValue])
	return (
		<div>
			<label>{name}</label>
			<input type="checkbox" checked={value} onChange={onChange} />
		</div>
	)
}

function ItemCheckbox({ name }: { name: string }) {
	const focus = useMemo(() => getItem(name), [name])
	const [value, setValue] = useFocus(atom, focus)
	return <Checkbox name={name} value={value} setValue={setValue} />
}

function ClearVoyels() {
	const focus = useMemo(() => voyelsItems, [])
	const [disabled, clear] = useActiveFocus(
		atom,
		focus,
		[],
		// we could have a deep equality here, but this is enough to target the empty array
		(a) => a.length === 0,
	)
	return (
		<button disabled={disabled} onClick={clear}>
			Clear voyels
		</button>
	)
}

export default function CheckboxDemo() {
	return (
		<>
			<div>
				{names.map((name) => (
					<ItemCheckbox key={name} name={name} />
				))}
			</div>
			<ClearVoyels />
			<Json store={atom} />
		</>
	)
}
