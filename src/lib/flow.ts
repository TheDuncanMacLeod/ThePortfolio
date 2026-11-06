/**
 * Simulation d'une ligne de production à postes en série.
 *
 * - Flux poussé : chaque poste produit dès qu'il le peut, sans regarder l'aval.
 * - Flux tiré : un poste ne produit que si le stock aval est sous sa limite kanban.
 *
 * Ce module est pur (aucune dépendance à React ni au DOM) : à paramètres et
 * graine identiques, il produit exactement le même résultat, ce qui le rend testable.
 */

export type FlowMode = 'push' | 'pull';

export interface FlowParams {
	/** Pièces demandées par le client, par tour. */
	demand: number;
	/** Capacité du poste goulot, en pièces par tour. */
	bottleneck: number;
	/** Stock maximal autorisé devant chaque poste en flux tiré. */
	kanban: number;
	/** Aléa appliqué à la demande et aux capacités, de 0 à 1. */
	variability: number;
}

export interface Station {
	name: string;
	/** Capacité en pièces par tour, ou `null` pour le poste goulot réglable. */
	capacity: number | null;
}

export const STATIONS: readonly Station[] = [
	{ name: 'Découpe', capacity: 8 },
	{ name: 'Usinage', capacity: 6 },
	{ name: 'Assemblage', capacity: null },
	{ name: 'Contrôle', capacity: 7 },
];

export const DEFAULT_PARAMS: FlowParams = {
	demand: 4,
	bottleneck: 4,
	kanban: 6,
	variability: 0.2,
};

/** Plafond physique d'une file : l'atelier n'a pas une surface infinie. */
export const MAX_QUEUE = 150;

/** Nombre de tours pris en compte dans les indicateurs glissants. */
export const METRICS_WINDOW = 50;

/** Nombre de tours conservés pour le graphique. */
export const HISTORY_LENGTH = 120;

export interface FlowLine {
	mode: FlowMode;
	tick: number;
	rngState: number;
	/** Files d'attente devant chaque poste ; une pièce vaut son tour de création. */
	queues: number[][];
	/** Stock de produits finis. */
	finished: number[];
	started: number;
	shipped: number;
	/** Une entrée par tour, pour les indicateurs glissants. */
	recent: { demanded: number; shipped: number; leadTimeSum: number }[];
	wipHistory: number[];
}

export interface FlowMetrics {
	wip: number;
	/** Pièces livrées par tour. */
	throughput: number;
	/** Délai moyen de traversée, en tours. Vaut `null` tant que rien n'est livré. */
	leadTime: number | null;
	/** Part de la demande servie, de 0 à 1. Vaut `null` tant qu'il n'y a pas de demande. */
	serviceRate: number | null;
}

export function createLine(mode: FlowMode, seed = 42): FlowLine {
	return {
		mode,
		tick: 0,
		rngState: seed >>> 0,
		queues: STATIONS.map(() => []),
		finished: [],
		started: 0,
		shipped: 0,
		recent: [],
		wipHistory: [],
	};
}

/** Générateur Mulberry32 : reproductible, contrairement à `Math.random`. */
function nextRandom(line: FlowLine): number {
	line.rngState = (line.rngState + 0x6d2b79f5) >>> 0;
	let t = line.rngState;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Applique un aléa symétrique autour de `value`, arrondi à la pièce. */
function vary(line: FlowLine, value: number, variability: number): number {
	const noise = 1 + variability * (2 * nextRandom(line) - 1);
	return Math.max(0, Math.round(value * noise));
}

export function workInProgress(line: FlowLine): number {
	return line.queues.reduce((sum, queue) => sum + queue.length, line.finished.length);
}

/** Avance la ligne d'un tour, en place. */
export function step(line: FlowLine, params: FlowParams): void {
	const { mode, tick, queues, finished } = line;
	const limit = mode === 'pull' ? params.kanban : MAX_QUEUE;

	// 1. Le client se sert dans le stock de produits finis.
	const demanded = vary(line, params.demand, params.variability);
	const leaving = finished.splice(0, demanded);
	const leadTimeSum = leaving.reduce((sum, createdAt) => sum + (tick - createdAt), 0);
	line.shipped += leaving.length;

	// 2. Les postes travaillent de l'aval vers l'amont : une pièce ne traverse
	//    jamais toute la ligne en un seul tour.
	for (let index = STATIONS.length - 1; index >= 0; index -= 1) {
		const capacity = vary(line, STATIONS[index].capacity ?? params.bottleneck, params.variability);
		const output = index === STATIONS.length - 1 ? finished : queues[index + 1];
		const room = Math.max(0, limit - output.length);

		if (index === 0) {
			// Le premier poste puise dans une matière première illimitée.
			const count = Math.min(capacity, room);
			for (let piece = 0; piece < count; piece += 1) output.push(tick);
			line.started += count;
		} else {
			output.push(...queues[index].splice(0, Math.min(capacity, room)));
		}
	}

	line.tick += 1;
	line.recent.push({ demanded, shipped: leaving.length, leadTimeSum });
	if (line.recent.length > METRICS_WINDOW) line.recent.shift();
	line.wipHistory.push(workInProgress(line));
	if (line.wipHistory.length > HISTORY_LENGTH) line.wipHistory.shift();
}

export function run(line: FlowLine, params: FlowParams, ticks: number): FlowLine {
	for (let tick = 0; tick < ticks; tick += 1) step(line, params);
	return line;
}

export function metrics(line: FlowLine): FlowMetrics {
	const totals = line.recent.reduce(
		(sum, entry) => ({
			demanded: sum.demanded + entry.demanded,
			shipped: sum.shipped + entry.shipped,
			leadTimeSum: sum.leadTimeSum + entry.leadTimeSum,
		}),
		{ demanded: 0, shipped: 0, leadTimeSum: 0 },
	);

	return {
		wip: workInProgress(line),
		throughput: line.recent.length > 0 ? totals.shipped / line.recent.length : 0,
		leadTime: totals.shipped > 0 ? totals.leadTimeSum / totals.shipped : null,
		serviceRate: totals.demanded > 0 ? totals.shipped / totals.demanded : null,
	};
}
