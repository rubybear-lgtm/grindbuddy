<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Problem;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

#[Signature('grind:import-catalog {snapshot : Path to the catalog snapshot JSON file} {--skip-orphans : Skip orphaned company_problem rows instead of failing}')]
#[Description('Import public catalog problems, companies, and company problem associations from a snapshot')]
class ImportCatalogCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $snapshot = $this->readSnapshot((string) $this->argument('snapshot'));

        if ($snapshot === null) {
            return Command::FAILURE;
        }

        $problems = Arr::get($snapshot, 'problems', []);
        $companies = Arr::get($snapshot, 'companies', []);
        $companyProblems = Arr::get($snapshot, 'company_problems', []);
        $validCompanyIds = collect($companies)->pluck('id')->all();
        $validProblemIds = collect($problems)->pluck('id')->all();
        $orphanRows = collect($companyProblems)
            ->reject(fn (array $companyProblem): bool => in_array($companyProblem['company_id'], $validCompanyIds, true)
                && in_array($companyProblem['problem_id'], $validProblemIds, true));

        if ($orphanRows->isNotEmpty() && ! $this->option('skip-orphans')) {
            $this->error('Orphaned company_problem rows detected. Re-run with --skip-orphans to import valid rows only.');

            return Command::FAILURE;
        }

        DB::transaction(function () use ($problems, $companies, $companyProblems, $orphanRows): void {
            foreach ($problems as $problem) {
                Problem::query()->updateOrCreate(
                    ['id' => $problem['id']],
                    [
                        'number' => $problem['number'],
                        'title' => $problem['title'],
                        'difficulty' => $problem['difficulty'],
                        'patterns' => $problem['patterns'],
                        'neetcode_url' => $problem['neetcode_url'] ?? null,
                        'leetcode_url' => $problem['leetcode_url'],
                    ]
                );
            }

            foreach ($companies as $company) {
                Company::query()->updateOrCreate(
                    ['id' => $company['id']],
                    [
                        'name' => $company['name'],
                        'slug' => $company['slug'],
                        'color' => $company['color'] ?? null,
                    ]
                );
            }

            foreach ($companyProblems as $companyProblem) {
                if ($orphanRows->contains($companyProblem)) {
                    continue;
                }

                CompanyProblem::query()->updateOrCreate(
                    [
                        'company_id' => $companyProblem['company_id'],
                        'problem_id' => $companyProblem['problem_id'],
                    ],
                    [
                        'frequency' => $companyProblem['frequency'] ?? 0,
                        'timeframe' => $companyProblem['timeframe'],
                    ]
                );
            }
        });

        $importedCompanyProblems = count($companyProblems) - $orphanRows->count();

        $this->info(sprintf(
            'Imported %d problems, %d companies, %d company_problems.',
            count($problems),
            count($companies),
            $importedCompanyProblems,
        ));

        if ($orphanRows->isNotEmpty()) {
            $this->warn(sprintf('Skipped %d orphan company_problem rows.', $orphanRows->count()));
        }

        return Command::SUCCESS;
    }

    /**
     * @return array{problems?: array<int, array<string, mixed>>, companies?: array<int, array<string, mixed>>, company_problems?: array<int, array<string, mixed>>}|null
     */
    private function readSnapshot(string $snapshotPath): ?array
    {
        if (! is_file($snapshotPath)) {
            $this->error("Catalog snapshot not found: {$snapshotPath}");

            return null;
        }

        return json_decode((string) file_get_contents($snapshotPath), true, flags: JSON_THROW_ON_ERROR);
    }
}
