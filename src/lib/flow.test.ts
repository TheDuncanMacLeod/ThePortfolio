import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PARAMS,
	HISTORY_LENGTH,
	MAX_QUEUE,
	createLine,
	metrics,
	run,
	step,
	workInProgress,
} from './flow';

describe('simulation de flux', () => {
	it('est reproductible à graine identique', () => {
		const first = run(createLine('pull', 7), DEFAULT_PARAMS, 200);
		const second = run(createLine('pull', 7), DEFAULT_PARAMS, 200);
		expect(first).toEqual(second);
	});

	it('varie avec la graine', () => {
		const first = run(createLine('push', 1), DEFAULT_PARAMS, 200);
		const second = run(createLine('push', 2), DEFAULT_PARAMS, 200);
		expect(first.shipped).not.toBe(second.shipped);
	});

	it('ne perd ni ne crée aucune pièce', () => {
		for (const mode of ['push', 'pull'] as const) {
			const line = run(createLine(mode), DEFAULT_PARAMS, 500);
			expect(line.started).toBe(workInProgress(line) + line.shipped);
		}
	});

	it('respecte la limite kanban à chaque tour en flux tiré', () => {
		const line = createLine('pull');
		for (let tick = 0; tick < 500; tick += 1) {
			step(line, DEFAULT_PARAMS);
			for (const queue of line.queues.slice(1)) {
				expect(queue.length).toBeLessThanOrEqual(DEFAULT_PARAMS.kanban);
			}
			expect(line.finished.length).toBeLessThanOrEqual(DEFAULT_PARAMS.kanban);
		}
	});

	it('plafonne les files en flux poussé', () => {
		const params = { ...DEFAULT_PARAMS, demand: 1, bottleneck: 1 };
		const line = run(createLine('push'), params, 2000);
		for (const queue of line.queues) {
			expect(queue.length).toBeLessThanOrEqual(MAX_QUEUE);
		}
	});

	it('livre autant en flux tiré, avec bien moins d\'encours et de délai', () => {
		const push = metrics(run(createLine('push'), DEFAULT_PARAMS, 800));
		const pull = metrics(run(createLine('pull'), DEFAULT_PARAMS, 800));

		expect(pull.throughput).toBeGreaterThan(push.throughput * 0.9);
		expect(pull.wip).toBeLessThan(push.wip / 5);
		expect(pull.leadTime!).toBeLessThan(push.leadTime! / 5);
	});

	it('vérifie la loi de Little en régime établi', () => {
		const params = { ...DEFAULT_PARAMS, variability: 0, demand: 3 };
		const line = run(createLine('pull'), params, 500);
		const { wip, throughput, leadTime } = metrics(line);
		expect(leadTime!).toBeCloseTo(wip / throughput, 0);
	});

	it('ne dépasse pas la capacité du goulot', () => {
		const params = { ...DEFAULT_PARAMS, demand: 8, bottleneck: 2, variability: 0 };
		const { throughput } = metrics(run(createLine('push'), params, 300));
		expect(throughput).toBeCloseTo(2, 5);
	});

	it('arrête la production tirée quand personne ne commande', () => {
		const params = { ...DEFAULT_PARAMS, demand: 0, variability: 0 };
		const line = run(createLine('pull'), params, 100);
		const started = line.started;
		run(line, params, 100);
		expect(line.started).toBe(started);
	});

	it('borne l\'historique du graphique', () => {
		const line = run(createLine('pull'), DEFAULT_PARAMS, HISTORY_LENGTH * 2);
		expect(line.wipHistory).toHaveLength(HISTORY_LENGTH);
	});

	it('renvoie des indicateurs vides avant le premier tour', () => {
		expect(metrics(createLine('pull'))).toEqual({
			wip: 0,
			throughput: 0,
			leadTime: null,
			serviceRate: null,
		});
	});
});
