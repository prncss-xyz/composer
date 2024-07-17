import Heading from '@theme/Heading'
import clsx from 'clsx'
import {
	TbBatteryCharging,
	TbCheckbox,
	TbFeather,
	TbLambda,
} from 'react-icons/tb'

import styles from './styles.module.css'

type FeatureItem = {
	title: string
	Svg: React.ComponentType<React.ComponentProps<'svg'>>
	description: JSX.Element
}

const FeatureList: FeatureItem[] = [
	// lambda
	{
		title: 'Pure Functions',
		Svg: TbLambda,
		description: (
			<>
				Define your state logic with composable (mostly) pure functions. Make it
				uncoupled and testable.
			</>
		),
	},
	// battery
	{
		title: 'Well known approaches',
		Svg: TbBatteryCharging,
		description: (
			<>Finite state machines, functional optics, debounce, throttle.</>
		),
	},
	// feather
	{
		title: 'Lightweight',
		Svg: TbFeather,
		description: <>The library is tree-shakable and has no dependencies.</>,
	},
	// gear
	{
		title: 'Opt-in integration',
		Svg: TbCheckbox,
		description: <>Simple react integration as a separate package.</>,
	},
]

function Feature({ title, Svg, description }: FeatureItem) {
	return (
		<div className={clsx('col col--4')}>
			<div className="text--center">
				<Svg className={styles.featureSvg} role="img" />
			</div>
			<div className="text--center padding-horiz--md">
				<Heading as="h3">{title}</Heading>
				<p>{description}</p>
			</div>
		</div>
	)
}

export default function HomepageFeatures(): JSX.Element {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	)
}
