<?php

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Log;
use App\Models\Problem;
use App\Models\User;

it('E1: full expert user gets composite=100 on all patterns', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'eval-e1', 'slug' => 'eval-e1', 'name' => 'Eval E1']);

    $a1 = Problem::factory()->create(['id' => 'e1-a1', 'difficulty' => 'Easy', 'patterns' => ['Pattern A']]);
    $a2 = Problem::factory()->create(['id' => 'e1-a2', 'difficulty' => 'Hard', 'patterns' => ['Pattern A']]);
    $b1 = Problem::factory()->create(['id' => 'e1-b1', 'difficulty' => 'Medium', 'patterns' => ['Pattern B']]);
    $b2 = Problem::factory()->create(['id' => 'e1-b2', 'difficulty' => 'Hard', 'patterns' => ['Pattern B']]);
    $c1 = Problem::factory()->create(['id' => 'e1-c1', 'difficulty' => 'Easy', 'patterns' => ['Pattern C']]);
    $c2 = Problem::factory()->create(['id' => 'e1-c2', 'difficulty' => 'Medium', 'patterns' => ['Pattern C']]);

    foreach ([$a1, $a2, $b1, $b2, $c1, $c2] as $problem) {
        CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $problem->id]);
        Log::factory()->create([
            'user_id' => $user->id,
            'problem_id' => $problem->id,
            'status' => 'Optimal',
            'timestamp' => now(),
        ]);
    }

    $response = $this->actingAs($user)->getJson('/api/companies/eval-e1/match');

    $response->assertOk();

    $patternReadiness = $response->json('user.patternReadiness');

    expect($response->json('patterns.Pattern A.composite'))->toBe(100)
        ->and($response->json('patterns.Pattern B.composite'))->toBe(100)
        ->and($response->json('patterns.Pattern C.composite'))->toBe(100)
        ->and($response->json('user.totalAttempted'))->toBe(6)
        ->and($response->json('user.overallReadiness'))->toBe(100)
        ->and($patternReadiness)->toBeArray()
        ->and($patternReadiness)->toHaveKeys(['Pattern A', 'Pattern B', 'Pattern C'])
        ->and($patternReadiness['Pattern A'])->toBe(100)
        ->and($patternReadiness['Pattern B'])->toBe(100)
        ->and($patternReadiness['Pattern C'])->toBe(100)
        ->and($response->json('recommendations'))->toBeArray()
        ->and($response->json('recommendations'))->toBeEmpty();
});

it('E2: zero coverage user gets all-zero metrics and no division-by-zero errors', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'eval-e2', 'slug' => 'eval-e2', 'name' => 'Eval E2']);

    $p1 = Problem::factory()->create(['id' => 'e2-p1', 'difficulty' => 'Easy', 'patterns' => ['Pattern A']]);
    $p2 = Problem::factory()->create(['id' => 'e2-p2', 'difficulty' => 'Hard', 'patterns' => ['Pattern A']]);

    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $p1->id]);
    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $p2->id]);

    $response = $this->actingAs($user)->getJson('/api/companies/eval-e2/match');

    $response->assertOk();

    expect($response->json('patterns.Pattern A.coverage'))->toBe(0)
        ->and($response->json('patterns.Pattern A.alignment'))->toBe(0)
        ->and($response->json('patterns.Pattern A.composite'))->toBe(0)
        ->and($response->json('patterns.Pattern A.mastery'))->toBe(0)
        ->and($response->json('patterns.Pattern A.gap'))->toBe(100)
        ->and($response->json('user.totalAttempted'))->toBe(0)
        ->and($response->json('user.overallReadiness'))->toBe(0)
        ->and($response->json('recommendations'))->toBeArray()
        ->and(count($response->json('recommendations')))->toBeGreaterThan(0)
        ->and($response->json('recommendations.0.status'))->toBe('unsolved')
        ->and($response->json('recommendations.0'))->toHaveKeys(['title', 'difficulty', 'pattern', 'status', 'reason', 'priority']);
});

it('E3: per-pattern coverage is isolated correctly across patterns with varying user completion', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'eval-e3', 'slug' => 'eval-e3', 'name' => 'Eval E3']);

    $a1 = Problem::factory()->create(['id' => 'e3-a1', 'difficulty' => 'Medium', 'patterns' => ['Pattern A']]);
    $a2 = Problem::factory()->create(['id' => 'e3-a2', 'difficulty' => 'Medium', 'patterns' => ['Pattern A']]);
    $b1 = Problem::factory()->create(['id' => 'e3-b1', 'difficulty' => 'Medium', 'patterns' => ['Pattern B']]);
    $b2 = Problem::factory()->create(['id' => 'e3-b2', 'difficulty' => 'Medium', 'patterns' => ['Pattern B']]);
    $c1 = Problem::factory()->create(['id' => 'e3-c1', 'difficulty' => 'Medium', 'patterns' => ['Pattern C']]);
    $c2 = Problem::factory()->create(['id' => 'e3-c2', 'difficulty' => 'Medium', 'patterns' => ['Pattern C']]);

    foreach ([$a1, $a2, $b1, $b2, $c1, $c2] as $problem) {
        CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $problem->id]);
    }

    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $a1->id,
        'status' => 'Optimal',
        'timestamp' => now(),
    ]);
    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $a2->id,
        'status' => 'Optimal',
        'timestamp' => now(),
    ]);
    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $b1->id,
        'status' => 'Optimal',
        'timestamp' => now(),
    ]);

    $response = $this->actingAs($user)->getJson('/api/companies/eval-e3/match');

    $response->assertOk();

    expect($response->json('patterns.Pattern A.coverage'))->toBe(100)
        ->and($response->json('patterns.Pattern B.coverage'))->toBe(50)
        ->and($response->json('patterns.Pattern C.coverage'))->toBe(0)
        ->and($response->json('patterns'))->toHaveKey('Pattern C')
        ->and($response->json('user.overallReadiness'))->toBeGreaterThanOrEqual(0)
        ->and($response->json('user.overallReadiness'))->toBeLessThanOrEqual(100);
});
