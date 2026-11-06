import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// Le build échoue si une donnée ne respecte pas ces schémas.

const experience = defineCollection({
	loader: file('src/data/experience.json'),
	schema: z.object({
		order: z.number(),
		period: z.string(),
		role: z.string(),
		company: z.string(),
		location: z.string(),
		phase: z.enum(['dev', 'industrie']),
		summary: z.string().optional(),
		details: z.array(z.object({ title: z.string(), text: z.string() })),
	}),
});

const education = defineCollection({
	loader: file('src/data/education.json'),
	schema: z.object({
		order: z.number(),
		year: z.string(),
		title: z.string(),
		school: z.string(),
		points: z.array(z.string()),
		current: z.boolean(),
	}),
});

const projects = defineCollection({
	loader: file('src/data/projects.json'),
	schema: z.object({
		order: z.number(),
		feature: z.boolean().default(false),
		meta: z.string(),
		title: z.string(),
		text: z.string(),
		tags: z.array(z.string()),
		link: z.object({ label: z.string(), href: z.string() }).optional(),
	}),
});

const skills = defineCollection({
	loader: file('src/data/skills.json'),
	schema: z.object({
		order: z.number(),
		label: z.string(),
		skills: z.array(z.object({ name: z.string(), level: z.number().int().min(1).max(3) })),
	}),
});

export const collections = { experience, education, projects, skills };
