<?php

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Log;
use App\Models\Problem;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

function writeCatalogSnapshot(array $overrides = []): string
{
    $snapshot = array_replace_recursive([
        'problems' => [
            [
                'id' => 'two-sum',
                'number' => 1,
                'title' => 'Two Sum',
                'difficulty' => 'Easy',
                'patterns' => ['arrays-hashing'],
                'neetcode_url' => 'https://neetcode.io/problems/two-sum',
                'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
            ],
            [
                'id' => 'valid-parentheses',
                'number' => 20,
                'title' => 'Valid Parentheses',
                'difficulty' => 'Easy',
                'patterns' => ['stack'],
                'neetcode_url' => null,
                'leetcode_url' => 'https://leetcode.com/problems/valid-parentheses/',
            ],
        ],
        'companies' => [
            [
                'id' => 'google',
                'name' => 'Google',
                'slug' => 'google',
                'color' => '#4285f4',
            ],
            [
                'id' => 'meta',
                'name' => 'Meta',
                'slug' => 'meta',
                'color' => null,
            ],
        ],
        'company_problems' => [
            [
                'company_id' => 'google',
                'problem_id' => 'two-sum',
                'frequency' => 15,
                'timeframe' => '30 days',
            ],
            [
                'company_id' => 'meta',
                'problem_id' => 'valid-parentheses',
                'frequency' => 8,
                'timeframe' => '6 months',
            ],
        ],
        'logs' => [
            [
                'id' => 'source-log-1',
                'user_id' => 999,
                'problem_id' => 'two-sum',
                'status' => 'solved',
            ],
        ],
        'users' => [
            [
                'id' => 999,
                'email' => 'source-user@example.com',
            ],
        ],
        'sessions' => [
            [
                'id' => 'source-session',
                'user_id' => 999,
            ],
        ],
        'accounts' => [
            [
                'id' => 'source-account',
                'user_id' => 999,
            ],
        ],
        'verification_tokens' => [
            [
                'identifier' => 'source-user@example.com',
            ],
        ],
    ], $overrides);

    $path = storage_path('framework/testing/catalog-snapshot-'.str()->uuid().'.json');

    file_put_contents($path, json_encode($snapshot, JSON_THROW_ON_ERROR));

    return $path;
}

function orphanCatalogSnapshot(): string
{
    return writeCatalogSnapshot([
        'company_problems' => [
            [
                'company_id' => 'google',
                'problem_id' => 'two-sum',
                'frequency' => 15,
                'timeframe' => '30 days',
            ],
            [
                'company_id' => 'missing-company',
                'problem_id' => 'two-sum',
                'frequency' => 3,
                'timeframe' => '30 days',
            ],
            [
                'company_id' => 'google',
                'problem_id' => 'missing-problem',
                'frequency' => 4,
                'timeframe' => '30 days',
            ],
        ],
    ]);
}

it('is idempotent', function () {
    $snapshotPath = writeCatalogSnapshot();

    $this->artisan('grind:import-catalog', ['snapshot' => $snapshotPath])
        ->assertExitCode(Command::SUCCESS);

    $rowCounts = [
        'problems' => Problem::count(),
        'companies' => Company::count(),
        'company_problems' => CompanyProblem::count(),
    ];

    $this->artisan('grind:import-catalog', ['snapshot' => $snapshotPath])
        ->assertExitCode(Command::SUCCESS);

    expect([
        'problems' => Problem::count(),
        'companies' => Company::count(),
        'company_problems' => CompanyProblem::count(),
    ])->toBe($rowCounts);
    expect(CompanyProblem::query()
        ->leftJoin('companies', 'company_problems.company_id', '=', 'companies.id')
        ->leftJoin('problems', 'company_problems.problem_id', '=', 'problems.id')
        ->whereNull('companies.id')
        ->orWhereNull('problems.id')
        ->count())->toBe(0);
});

it('preserves source IDs', function () {
    $this->artisan('grind:import-catalog', ['snapshot' => writeCatalogSnapshot()])
        ->assertExitCode(Command::SUCCESS);

    expect(Problem::query()->pluck('id')->all())->toBe(['two-sum', 'valid-parentheses']);
    expect(Company::query()->pluck('id')->all())->toBe(['google', 'meta']);
    $this->assertDatabaseHas('company_problems', [
        'company_id' => 'google',
        'problem_id' => 'two-sum',
    ]);
});

it('detects orphaned company_problems', function () {
    $this->artisan('grind:import-catalog', ['snapshot' => orphanCatalogSnapshot()])
        ->expectsOutputToContain('Orphaned company_problem rows detected')
        ->assertExitCode(Command::FAILURE);

    expect(Problem::count())->toBe(0);
    expect(Company::count())->toBe(0);
    expect(CompanyProblem::count())->toBe(0);
});

it('skips orphans with skip-orphans flag', function () {
    $this->artisan('grind:import-catalog', [
        'snapshot' => orphanCatalogSnapshot(),
        '--skip-orphans' => true,
    ])
        ->expectsOutput('Imported 2 problems, 2 companies, 1 company_problems.')
        ->expectsOutput('Skipped 2 orphan company_problem rows.')
        ->assertExitCode(Command::SUCCESS);

    expect(CompanyProblem::count())->toBe(1);
    $this->assertDatabaseHas('company_problems', [
        'company_id' => 'google',
        'problem_id' => 'two-sum',
    ]);
});

it('does not import logs', function () {
    $this->artisan('grind:import-catalog', ['snapshot' => writeCatalogSnapshot()])
        ->assertExitCode(Command::SUCCESS);

    expect(Log::count())->toBe(0);
});

it('does not import neon auth data', function () {
    $this->artisan('grind:import-catalog', ['snapshot' => writeCatalogSnapshot()])
        ->assertExitCode(Command::SUCCESS);

    expect(User::count())->toBe(0);
    expect(SocialAccount::count())->toBe(0);
    expect(DB::table('sessions')->count())->toBe(0);
});

it('reports import counts', function () {
    $this->artisan('grind:import-catalog', ['snapshot' => writeCatalogSnapshot()])
        ->expectsOutput('Imported 2 problems, 2 companies, 2 company_problems.')
        ->assertExitCode(Command::SUCCESS);
});

it('fails when the snapshot file is missing', function () {
    $missingSnapshotPath = storage_path('framework/testing/missing-catalog-snapshot.json');

    $this->artisan('grind:import-catalog', ['snapshot' => $missingSnapshotPath])
        ->expectsOutputToContain('Catalog snapshot not found')
        ->assertExitCode(Command::FAILURE);
});
