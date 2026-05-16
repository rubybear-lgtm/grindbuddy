<?php

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Log;
use App\Models\Problem;
use App\Models\User;

it('creates a problem preserving text primary key, integer number, and patterns array', function () {
    $problem = Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'difficulty' => 'Easy',
        'patterns' => ['arrays-hashing'],
        'neetcode_url' => null,
        'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
    ]);

    expect($problem->id)->toBe('two-sum');
    expect($problem->number)->toBe(1);
    expect($problem->patterns)->toBe(['arrays-hashing']);
    expect($problem->neetcode_url)->toBeNull();
    expect(Problem::find('two-sum'))->not->toBeNull();
});

it('creates a company with unique slug and nullable color', function () {
    $company = Company::factory()->create([
        'id' => 'google',
        'name' => 'Google',
        'slug' => 'google',
        'color' => null,
    ]);

    expect($company->id)->toBe('google');
    expect($company->slug)->toBe('google');
    expect($company->color)->toBeNull();
});

it('associates problems and companies through company_problems pivot', function () {
    $company = Company::factory()->create(['id' => 'meta', 'slug' => 'meta']);
    $problem = Problem::factory()->create(['id' => 'valid-parens']);

    $pivot = CompanyProblem::factory()->create([
        'company_id' => $company->id,
        'problem_id' => $problem->id,
        'frequency' => 12,
        'timeframe' => '30 days',
    ]);

    expect($pivot->frequency)->toBe(12);
    expect($company->problems)->toHaveCount(1);
    expect($company->problems->first()->id)->toBe($problem->id);
    expect($problem->companies)->toHaveCount(1);
    expect($problem->companies->first()->id)->toBe($company->id);
});

it('records a log owned by a user and references a problem', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'merge-intervals']);

    $log = Log::factory()->create([
        'id' => 'log-1',
        'user_id' => $user->id,
        'problem_id' => $problem->id,
        'status' => 'solved',
        'time_complexity' => 'O(n log n)',
        'space_complexity' => 'O(n)',
        'notes' => 'sort then merge',
        'timestamp' => now(),
    ]);

    expect($log->user->id)->toBe($user->id);
    expect($log->problem->id)->toBe($problem->id);
    expect($problem->logs)->toHaveCount(1);
});

it('cascades log deletion when its user is deleted', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create();

    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $problem->id,
    ]);

    expect(Log::count())->toBe(1);

    $user->delete();

    expect(Log::count())->toBe(0);
});

it('cascades company_problems when company is deleted', function () {
    $company = Company::factory()->create();
    $problem = Problem::factory()->create();

    CompanyProblem::factory()->create([
        'company_id' => $company->id,
        'problem_id' => $problem->id,
    ]);

    expect(CompanyProblem::count())->toBe(1);

    $company->delete();

    expect(CompanyProblem::count())->toBe(0);
});
