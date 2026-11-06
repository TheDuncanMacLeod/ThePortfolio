import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
	DEFAULT_PARAMS,
	MAX_QUEUE,
	STATIONS,
	createLine,
	metrics,
	run,
	step,
	type FlowLine,
	type FlowMetrics,
	type FlowParams,
} from '../lib/flow';
import '../styles/simulator.css';

const TICK_MS = 160;
/** Tours pré-calculés : la page montre un résultat avant même le premier clic. */
const INITIAL_TICKS = 60;
const MAX_BLOCKS = 18;

const SERIES = {
	push: { label: 'Flux poussé', className: 'series-push' },
	pull: { label: 'Flux tiré', className: 'series-pull' },
} as const;

interface Lines {
	push: FlowLine;
	pull: FlowLine;
}

function createLines(ticks: number, params: FlowParams): Lines {
	return {
		push: run(createLine('push'), params, ticks),
		pull: run(createLine('pull'), params, ticks),
	};
}

const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 });

function formatNullable(value: number | null, format: (value: number) => string): string {
	return value === null ? '–' : format(value);
}

/* --- Curseurs ------------------------------------------------------------- */

interface SliderProps {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	display: string;
	onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step: stepSize = 1, display, onChange }: SliderProps) {
	return (
		<label className="sim-slider">
			<span className="sim-slider__label">
				{label}
				<output>{display}</output>
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={stepSize}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
			/>
		</label>
	);
}

/* --- Ligne de production --------------------------------------------------- */

function Queue({ count, title }: { count: number; title: string }) {
	const blocks = Math.min(count, MAX_BLOCKS);
	return (
		<div className="sim-queue" title={title}>
			<div className="sim-queue__blocks" aria-hidden="true">
				{Array.from({ length: blocks }, (_, index) => (
					<span key={index} />
				))}
			</div>
			<span className="sim-queue__count">{count >= MAX_QUEUE ? `${count} max` : count}</span>
		</div>
	);
}

function ProductionLine({ line }: { line: FlowLine }) {
	const series = SERIES[line.mode];
	return (
		<div className={`sim-line ${series.className}`}>
			<h4 className="sim-line__title">{series.label}</h4>
			<ol className="sim-line__stations">
				{STATIONS.map((station, index) => (
					<li key={station.name}>
						{index > 0 && <Queue count={line.queues[index].length} title={`Pièces en attente avant ${station.name}`} />}
						<div className={station.capacity === null ? 'sim-station sim-station--bottleneck' : 'sim-station'}>
							{station.name}
						</div>
					</li>
				))}
				<li>
					<Queue count={line.finished.length} title="Produits finis en stock" />
					<div className="sim-station sim-station--end">Client</div>
				</li>
			</ol>
		</div>
	);
}

/* --- Graphique d'encours --------------------------------------------------- */

const CHART_HEIGHT = 210;
const MARGIN = { top: 16, right: 78, bottom: 26, left: 40 };

function niceMax(value: number): number {
	for (const ceiling of [20, 50, 100, 200, 300, 400, 500, 600]) {
		if (value <= ceiling) return ceiling;
	}
	return Math.ceil(value / 100) * 100;
}

function useWidth<T extends HTMLElement>(fallback: number) {
	const ref = useRef<T>(null);
	const [width, setWidth] = useState(fallback);

	useEffect(() => {
		if (!ref.current) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	return [ref, width] as const;
}

function WipChart({ push, pull }: { push: number[]; pull: number[] }) {
	const [wrapRef, width] = useWidth<HTMLDivElement>(640);
	const [hover, setHover] = useState<number | null>(null);

	const length = Math.max(push.length, pull.length);
	const maxY = niceMax(Math.max(1, ...push, ...pull));
	const plotWidth = Math.max(40, width - MARGIN.left - MARGIN.right);
	const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
	const x = (index: number) => MARGIN.left + (length > 1 ? (index / (length - 1)) * plotWidth : 0);
	const y = (value: number) => MARGIN.top + plotHeight * (1 - value / maxY);
	const path = (values: number[]) => values.map((value, index) => `${x(index)},${y(value)}`).join(' ');

	function handlePointer(event: PointerEvent<SVGSVGElement>) {
		if (length < 2) return;
		const left = event.currentTarget.getBoundingClientRect().left;
		const ratio = (event.clientX - left - MARGIN.left) / plotWidth;
		setHover(Math.min(length - 1, Math.max(0, Math.round(ratio * (length - 1)))));
	}

	const shown = hover !== null && hover < length ? hover : null;

	return (
		<figure className="sim-chart" ref={wrapRef}>
			<figcaption>Encours total, en pièces, sur les {length} derniers tours</figcaption>
			<ul className="sim-legend">
				<li className="series-push">{SERIES.push.label}</li>
				<li className="series-pull">{SERIES.pull.label}</li>
			</ul>

			<svg
				viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
				role="img"
				aria-label="Courbes de l'encours des deux lignes. Les valeurs actuelles sont dans le tableau voisin."
				onPointerMove={handlePointer}
				onPointerLeave={() => setHover(null)}
			>
				{[0, 0.5, 1].map((share) => (
					<g key={share}>
						<line className="sim-grid" x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(maxY * share)} y2={y(maxY * share)} />
						<text className="sim-axis" x={MARGIN.left - 8} y={y(maxY * share) + 4} textAnchor="end">
							{maxY * share}
						</text>
					</g>
				))}
				<text className="sim-axis" x={MARGIN.left + plotWidth} y={CHART_HEIGHT - 6} textAnchor="end">
					Maintenant
				</text>

				<polyline className="sim-series series-push" points={path(push)} />
				<polyline className="sim-series series-pull" points={path(pull)} />

				{length > 0 && (
					<>
						<text className="sim-direct series-push" x={x(length - 1) + 8} y={y(push[push.length - 1]) + 4}>
							Poussé
						</text>
						<text className="sim-direct series-pull" x={x(length - 1) + 8} y={y(pull[pull.length - 1]) + 4}>
							Tiré
						</text>
					</>
				)}

				{shown !== null && (
					<line className="sim-crosshair" x1={x(shown)} x2={x(shown)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
				)}
			</svg>

			{shown !== null && (
				<div className="sim-tooltip" style={{ left: Math.min(x(shown) + 10, width - 130) }}>
					<div className="series-push"><strong>{push[shown]}</strong> poussé</div>
					<div className="series-pull"><strong>{pull[shown]}</strong> tiré</div>
				</div>
			)}
		</figure>
	);
}

/* --- Tableau d'indicateurs -------------------------------------------------- */

const ROWS: { label: string; read: (value: FlowMetrics) => string }[] = [
	{ label: 'Encours (pièces)', read: (value) => String(value.wip) },
	{ label: 'Débit (pièces par tour)', read: (value) => decimal.format(value.throughput) },
	{ label: 'Délai (tours)', read: (value) => formatNullable(value.leadTime, decimal.format) },
	{ label: 'Demande servie', read: (value) => formatNullable(value.serviceRate, percent.format) },
];

function MetricsTable({ push, pull }: { push: FlowMetrics; pull: FlowMetrics }) {
	return (
		<table className="sim-table">
			<caption className="visually-hidden">Indicateurs des deux lignes sur les derniers tours</caption>
			<thead>
				<tr>
					<td />
					<th scope="col">Poussé</th>
					<th scope="col">Tiré</th>
				</tr>
			</thead>
			<tbody>
				{ROWS.map((row) => (
					<tr key={row.label}>
						<th scope="row">{row.label}</th>
						<td>{row.read(push)}</td>
						<td>{row.read(pull)}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

/* --- Simulateur ------------------------------------------------------------ */

export default function FlowSimulator() {
	const [params, setParams] = useState<FlowParams>(DEFAULT_PARAMS);
	const [running, setRunning] = useState(false);
	const [, setFrame] = useState(0);
	const paramsRef = useRef(params);
	const linesRef = useRef<Lines | null>(null);

	if (linesRef.current === null) linesRef.current = createLines(INITIAL_TICKS, DEFAULT_PARAMS);
	const lines = linesRef.current;

	useEffect(() => {
		paramsRef.current = params;
	}, [params]);

	useEffect(() => {
		if (!running) return;
		const timer = window.setInterval(() => {
			const current = linesRef.current;
			if (!current) return;
			step(current.push, paramsRef.current);
			step(current.pull, paramsRef.current);
			setFrame((frame) => frame + 1);
		}, TICK_MS);
		return () => window.clearInterval(timer);
	}, [running]);

	function update(change: Partial<FlowParams>) {
		setParams((current) => ({ ...current, ...change }));
	}

	function reset() {
		setRunning(false);
		linesRef.current = createLines(0, paramsRef.current);
		setFrame((frame) => frame + 1);
	}

	const pushMetrics = metrics(lines.push);
	const pullMetrics = metrics(lines.pull);

	return (
		<div className="sim">
			<div className="sim__controls">
				<Slider label="Demande client" value={params.demand} min={1} max={8} display={`${params.demand} / tour`} onChange={(demand) => update({ demand })} />
				<Slider label="Capacité du goulot" value={params.bottleneck} min={1} max={8} display={`${params.bottleneck} / tour`} onChange={(bottleneck) => update({ bottleneck })} />
				<Slider label="Limite kanban" value={params.kanban} min={2} max={20} display={`${params.kanban} pièces`} onChange={(kanban) => update({ kanban })} />
				<Slider label="Variabilité" value={params.variability} min={0} max={0.5} step={0.05} display={percent.format(params.variability)} onChange={(variability) => update({ variability })} />

				<div className="sim__buttons">
					<button className="btn btn--primary" type="button" onClick={() => setRunning(!running)}>
						{running ? 'Pause' : 'Lancer'}
					</button>
					<button className="btn btn--ghost" type="button" onClick={reset}>Réinitialiser</button>
					<span className="sim__tick">Tour <span data-testid="tick">{lines.pull.tick}</span></span>
				</div>
			</div>

			<div className="sim__lines">
				<ProductionLine line={lines.push} />
				<ProductionLine line={lines.pull} />
			</div>

			<div className="sim__results">
				<WipChart push={lines.push.wipHistory} pull={lines.pull.wipHistory} />
				<MetricsTable push={pushMetrics} pull={pullMetrics} />
			</div>
		</div>
	);
}
