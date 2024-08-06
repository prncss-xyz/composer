import { useMemo } from 'react'

import { Optic } from '../../../composer/dist/optics'
import { AtomStore } from '../../../composer/dist/stores'
import { AreEqual, Updater } from '../../../composer/dist/utils'
import { useSetStore, useStoreValue } from './stores'

function useFocusValue<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
) {
	return useStoreValue(atom, optic.view.bind(optic))
}

export function useSetFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value?: undefined,
): (value: Command | Updater<Part>) => void
export function useSetFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value: Command | Updater<Part>,
): () => void
// this is needed to make useFocus
export function useSetFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value?: undefined | Command | Updater<Part>,
): ((value: Command | Updater<Part>) => void) | (() => void)
export function useSetFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value?: undefined | Command | Updater<Part>,
) {
	return useMemo(
		() =>
			value === undefined
				? (value: Command | Updater<Part>) => atom.update(optic.update(value))
				: () => {
						atom.update(optic.update(value))
					},
		[value, atom, optic],
	)
}

export function useFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value?: undefined,
): readonly [Part | Fail, (value: Command | Updater<Part>) => void]
export function useFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value: Command | Updater<Part>,
): readonly [Part | Fail, () => void]
export function useFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value?: undefined | Command | Updater<Part>,
) {
	return [useFocusValue(atom, optic), useSetFocus(atom, optic, value)] as const
}

// Since we want to support removable optics, we cannot simply compoare getter to value
export function useActiveFocus<Part, Whole, Fail, Command>(
	atom: AtomStore<Whole>,
	optic: Optic<Part, Whole, Fail, Command>,
	value: Command | Updater<Part>,
	areEqual: AreEqual<Part | Fail> = Object.is,
) {
	const targetWhole = useStoreValue(atom, (whole) => optic.update(value)(whole))
	const targetPart = useMemo(
		() => optic.view(targetWhole),
		[optic, targetWhole],
	)
	const active = useStoreValue(atom, (whole) => {
		return !!areEqual(optic.view(whole), targetPart)
	})
	const activate = useSetStore(atom, targetWhole)
	return [active, activate] as const
}

// TODO: setWith
