import { Json } from '@/json'
import { useActiveFocus, useFocus } from '@/lib/foci'
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { eq, filter, includes, prop } from '../../../composer/dist/optics'
import { flow } from '../../../composer/dist/utils'
import { createAtom } from '@/lib/atoms'

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

// TODO: pipe
/* const allItems = flow(eq<State>(), prop('fields'), prop('contents')) */

const voyelsItems = flow(
	eq<State>(),
	prop('fields'),
	prop('contents'),
	filter(isVoyel),
)
const getItem = (s: string) =>
	flow(eq<State>(), prop('fields'), prop('contents'), includes(s))

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
