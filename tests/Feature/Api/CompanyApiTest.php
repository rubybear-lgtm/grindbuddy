<?php

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Log;
use App\Models\Problem;
use App\Models\User;

it('returns companies ordered by name', function () {
    Company::factory()->create(['id' => 'meta', 'name' => 'Meta', 'slug' => 'meta', 'color' => '#1877f2']);
    Company::factory()->create(['id' => 'amazon', 'name' => 'Amazon', 'slug' => 'amazon', 'color' => null]);

    $response = $this->getJson('/api/companies');

    $response->assertOk()->assertExactJson([
        ['id' => 'amazon', 'name' => 'Amazon', 'slug' => 'amazon', 'color' => null],
        ['id' => 'meta', 'name' => 'Meta', 'slug' => 'meta', 'color' => '#1877f2'],
    ]);
});

it('returns company detail aggregates by pattern', function () {
    $company = Company::factory()->create(['id' => 'google', 'name' => 'Google', 'slug' => 'google', 'color' => '#4285f4']);
    $twoSum = Problem::factory()->create([
        'id' => 'two-sum',
        'difficulty' => 'Easy',
        'patterns' => ['arrays-hashing'],
    ]);
    $threeSum = Problem::factory()->create([
        'id' => 'three-sum',
        'difficulty' => 'Medium',
        'patterns' => ['arrays-hashing', 'two-pointers'],
    ]);

    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $twoSum->id]);
    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $threeSum->id]);

    $response = $this->getJson('/api/companies/google');

    $response->assertOk()->assertExactJson([
        'id' => 'google',
        'name' => 'Google',
        'slug' => 'google',
        'color' => '#4285f4',
        'patterns' => [
            'arrays-hashing' => 100,
            'two-pointers' => 50,
        ],
        'patternCounts' => [
            'arrays-hashing' => 2,
            'two-pointers' => 1,
        ],
        'patternDifficulty' => [
            'arrays-hashing' => ['Easy' => 1, 'Medium' => 1, 'Hard' => 0],
            'two-pointers' => ['Easy' => 0, 'Medium' => 1, 'Hard' => 0],
        ],
        'totalProblems' => 2,
    ]);
});

it('returns not found for an unknown company detail', function () {
    $this->getJson('/api/companies/missing')
        ->assertNotFound()
        ->assertExactJson(['error' => 'Company not found']);
});

it('requires authentication for company match', function () {
    Company::factory()->create(['id' => 'netflix', 'slug' => 'netflix']);

    $this->getJson('/api/companies/netflix/match')->assertUnauthorized();
});

it('returns the skill match payload shape for the authenticated user', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'stripe', 'name' => 'Stripe', 'slug' => 'stripe', 'color' => null]);
    $problem = Problem::factory()->create([
        'id' => 'valid-parentheses',
        'difficulty' => 'Easy',
        'patterns' => ['stack'],
    ]);

    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $problem->id]);
    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $problem->id,
        'status' => 'Optimal',
        'timestamp' => now(),
    ]);

    $response = $this->actingAs($user)->getJson('/api/companies/stripe/match');

    $response->assertOk()->assertJson([
        'company' => [
            'slug' => 'stripe',
            'name' => 'Stripe',
            'color' => '#6366f1',
            'totalProblems' => 1,
            'patternFrequencies' => ['stack' => 100],
            'patternCounts' => ['stack' => 1],
            'patternDifficulty' => ['stack' => ['Easy' => 1, 'Medium' => 0, 'Hard' => 0]],
        ],
        'user' => ['totalAttempted' => 1, 'overallReadiness' => 100],
        'patterns' => [
            'stack' => [
                'companyCount' => 1,
                'userCount' => 1,
                'userWeighted' => 1,
                'userOptimal' => 1,
                'level' => 'expert',
            ],
        ],
    ])->assertJsonStructure([
        'company' => ['slug', 'name', 'color', 'totalProblems', 'patternFrequencies', 'patternCounts', 'patternDifficulty'],
        'user' => ['totalAttempted', 'overallReadiness'],
        'patterns' => [
            'stack' => [
                'companyCount', 'companyDifficulty', 'userCount', 'userWeighted', 'userOptimal',
                'userDifficulty', 'coverage', 'alignment', 'composite', 'mastery', 'gap', 'recency', 'level',
            ],
        ],
        'recommendations',
    ]);
});
