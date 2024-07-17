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
				Define your state logic with composable pure functions. Make it
				uncoupled and testable.
			</>
		),
	},
	// battery
	{
		title: 'Well known abstractions',
		Svg: TbBatteryCharging,
		description: (
			<>Enjoy finite state machines, functional optics, and async primitives.</>
		),
	},
	// feather
	{
		title: 'Lightweight',
		Svg: TbFeather,
		description: <>The library is tree-shakable and dependency-free.</>,
	},
	// gear
	{
		title: 'Opt-in integration',
		Svg: TbCheckbox,
		description: <>Use react integration with a separate package.</>,
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
