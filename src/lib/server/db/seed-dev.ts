import { db } from './index';
import { logs } from './schema';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';

config({ path: '.env' });

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

const LOG_ENTRIES: {
	problemId: string;
	status: string;
	timeComplexity: string;
	spaceComplexity: string;
	notes?: string;
	daysAgo: number;
}[] = [
	// Arrays & Hashing — well practiced
	{ problemId: 'two-sum', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 30 },
	{ problemId: 'two-sum', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 14 },
	{ problemId: 'two-sum', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 3 },
	{ problemId: 'contains-duplicate', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 28 },
	{ problemId: 'contains-duplicate', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 10 },
	{ problemId: 'valid-anagram', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 25 },
	{ problemId: 'valid-anagram', status: 'Suboptimal', timeComplexity: 'O(n log n)', spaceComplexity: 'O(1)', daysAgo: 8 },
	{ problemId: 'group-anagrams', status: 'Hints', timeComplexity: 'O(n*k)', spaceComplexity: 'O(n*k)', notes: 'Forgot to sort the key', daysAgo: 20 },
	{ problemId: 'group-anagrams', status: 'Optimal', timeComplexity: 'O(n*k)', spaceComplexity: 'O(n*k)', daysAgo: 5 },
	{ problemId: 'top-k-frequent-elements', status: 'Hints', timeComplexity: 'O(n log k)', spaceComplexity: 'O(n)', daysAgo: 18 },
	{ problemId: 'product-of-array-except-self', status: 'Solution', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', notes: 'Had to look up the prefix/suffix trick', daysAgo: 22 },
	{ problemId: 'longest-consecutive-sequence', status: 'Hints', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 15 },

	// Two Pointers — moderate
	{ problemId: 'valid-palindrome', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 26 },
	{ problemId: 'valid-palindrome', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 9 },
	{ problemId: 'two-sum-ii-input-array-is-sorted', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 21 },
	{ problemId: '3sum', status: 'Suboptimal', timeComplexity: 'O(n²)', spaceComplexity: 'O(n)', notes: 'Missed duplicate skipping logic', daysAgo: 19 },
	{ problemId: 'container-with-most-water', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 12 },
	{ problemId: 'trapping-rain-water', status: 'Hints', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 7 },

	// Stack
	{ problemId: 'valid-parentheses', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 24 },
	{ problemId: 'valid-parentheses', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 6 },
	{ problemId: 'min-stack', status: 'Optimal', timeComplexity: 'O(1)', spaceComplexity: 'O(n)', daysAgo: 17 },
	{ problemId: 'daily-temperatures', status: 'Suboptimal', timeComplexity: 'O(n²)', spaceComplexity: 'O(n)', notes: 'Used brute force, should use monotonic stack', daysAgo: 13 },
	{ problemId: 'generate-parentheses', status: 'Hints', timeComplexity: 'O(4^n/√n)', spaceComplexity: 'O(n)', daysAgo: 11 },
	{ problemId: 'largest-rectangle-in-histogram', status: 'Failed', timeComplexity: '', spaceComplexity: '', notes: 'Could not figure out the stack approach', daysAgo: 4 },

	// Binary Search — solid
	{ problemId: 'binary-search', status: 'Optimal', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', daysAgo: 27 },
	{ problemId: 'binary-search', status: 'Optimal', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', daysAgo: 8 },
	{ problemId: 'search-a-2d-matrix', status: 'Optimal', timeComplexity: 'O(log(m*n))', spaceComplexity: 'O(1)', daysAgo: 16 },
	{ problemId: 'find-minimum-in-rotated-sorted-array', status: 'Suboptimal', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', daysAgo: 10 },
	{ problemId: 'search-in-rotated-sorted-array', status: 'Hints', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', daysAgo: 6 },

	// Sliding Window
	{ problemId: 'best-time-to-buy-and-sell-stock', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 23 },
	{ problemId: 'best-time-to-buy-and-sell-stock', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 5 },
	{ problemId: 'longest-substring-without-repeating-characters', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 18 },
	{ problemId: 'longest-repeating-character-replacement', status: 'Hints', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', notes: 'Condition for shrinking window was tricky', daysAgo: 9 },
	{ problemId: 'minimum-window-substring', status: 'Solution', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 3 },

	// Linked List — weak area
	{ problemId: 'reverse-linked-list', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 29 },
	{ problemId: 'merge-two-sorted-lists', status: 'Suboptimal', timeComplexity: 'O(n+m)', spaceComplexity: 'O(n+m)', daysAgo: 20 },
	{ problemId: 'reorder-list', status: 'Failed', timeComplexity: '', spaceComplexity: '', notes: 'Forgot the find-middle + reverse + merge pattern', daysAgo: 14 },
	{ problemId: 'remove-nth-node-from-end-of-list', status: 'Hints', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', daysAgo: 7 },

	// Recent activity (shows on heatmap)
	{ problemId: 'valid-sudoku', status: 'Suboptimal', timeComplexity: 'O(1)', spaceComplexity: 'O(1)', daysAgo: 2 },
	{ problemId: 'encode-and-decode-strings', status: 'Optimal', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', daysAgo: 2 },
	{ problemId: 'car-fleet', status: 'Hints', timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)', daysAgo: 1 },
	{ problemId: 'koko-eating-bananas', status: 'Optimal', timeComplexity: 'O(n log m)', spaceComplexity: 'O(1)', daysAgo: 1 },
];

function daysAgoDate(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	d.setHours(Math.floor(Math.random() * 14) + 8);
	d.setMinutes(Math.floor(Math.random() * 60));
	return d;
}

async function main() {
	console.log('Seeding dev user and log entries...');

	// Upsert the dev user into neon_auth.user (camelCase columns, uuid id)
	await db.execute(sql`
		INSERT INTO neon_auth.user (id, name, email, "emailVerified", "createdAt", "updatedAt")
		VALUES (
			'00000000-0000-0000-0000-000000000001'::uuid,
			'Dev User',
			'dev@localhost',
			true,
			now(),
			now()
		)
		ON CONFLICT (id) DO NOTHING
	`);

	// Clear existing dev logs so re-running is idempotent
	await db.execute(sql`DELETE FROM logs WHERE user_id = '00000000-0000-0000-0000-000000000001'`);

	const rows = LOG_ENTRIES.map((entry, i) => ({
		id: `dev-log-${i}`,
		userId: DEV_USER_ID,
		problemId: entry.problemId,
		status: entry.status,
		timeComplexity: entry.timeComplexity || null,
		spaceComplexity: entry.spaceComplexity || null,
		notes: entry.notes ?? null,
		timestamp: daysAgoDate(entry.daysAgo),
	}));

	await db.insert(logs).values(rows);

	console.log(`Seeded ${rows.length} log entries for dev-user.`);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
