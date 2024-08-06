import { createAtom } from '@/lib/atoms'
import { useEffect } from 'react'

export const clock = createAtom(0)

export function useSetupClock(period = 100) {
	useEffect(() => {
		const timer = setInterval(() => {
			clock.put(Date.now())
		}, period)
		return () => clearInterval(timer)
	}, [period])
}
