import { Store } from './stores'

abstract class MountStore<T> extends Store<T> {
	private count = 0
	private unmount = () => {}
	abstract onMount(): () => void
	subscribe(subscriber: (t: T) => void) {
		const unsubscribe = super.subscribe(subscriber)
		this.count++
		if (this.count === 1)
			setTimeout(() => {
				if (this.count > 0) this.unmount = this.onMount()
			}, 0)
		return () => {
			unsubscribe()
			this.count--
			if (this.count === 0)
				setTimeout(() => {
					if (this.count === 0) this.unmount()
				}, 0)
		}
	}
}
