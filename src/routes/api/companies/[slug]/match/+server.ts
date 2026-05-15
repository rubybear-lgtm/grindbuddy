import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { companies, companyProblems, problems, logs } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { buildSkillMatchPayload, type LogEntry, type CompanyProblemEntry } from '$lib/utils/skillMatch.v2';

export async function GET({ params, locals }) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { slug } = params;

	const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
	if (!company) {
		throw error(404, 'Company not found');
	}

	const companyProblemRows = await db
		.select({
			problemId: companyProblems.problemId,
			patterns: problems.patterns,
			difficulty: problems.difficulty,
			frequency: companyProblems.frequency
		})
		.from(companyProblems)
		.innerJoin(problems, eq(companyProblems.problemId, problems.id))
		.where(eq(companyProblems.companyId, company.id));

	const companyEntries: CompanyProblemEntry[] = companyProblemRows.map((row) => ({
		problemId: row.problemId,
		patterns: row.patterns as CompanyProblemEntry['patterns'],
		difficulty: row.difficulty as CompanyProblemEntry['difficulty'],
		frequency: row.frequency ?? 0
	}));

	const userLogRows = await db
		.select({
			problemId: logs.problemId,
			status: logs.status,
			timestamp: logs.timestamp,
			difficulty: problems.difficulty,
			patterns: problems.patterns
		})
		.from(logs)
		.innerJoin(problems, eq(logs.problemId, problems.id))
		.where(eq(logs.userId, locals.user.id))
		.orderBy(desc(logs.timestamp));

	const logEntries: LogEntry[] = userLogRows.map((row) => ({
		problemId: row.problemId,
		status: row.status,
		timestamp: row.timestamp,
		difficulty: row.difficulty as LogEntry['difficulty'],
		patterns: row.patterns as LogEntry['patterns']
	}));

	const payload = buildSkillMatchPayload(company, companyEntries, logEntries);
	return json(payload);
}
