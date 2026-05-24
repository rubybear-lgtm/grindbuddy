<?php

use App\Models\Log;
use App\Models\Problem;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for the problem page', function () {
    Problem::factory()->create(['id' => 'two-sum']);

    $this->get('/problems/two-sum')->assertRedirect(route('login'));
});

it('renders the problem page with problem data and no logs for fresh users', function () {
    $user = User::factory()->create();
    Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'difficulty' => 'Easy',
        'patterns' => ['arrays-hashing'],
        'neetcode_url' => null,
        'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
    ]);

    $this->actingAs($user)->get('/problems/two-sum')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('problem')
            ->where('problem.id', 'two-sum')
            ->where('problem.number', 1)
            ->where('problem.title', 'Two Sum')
            ->where('problem.difficulty', 'Easy')
            ->where('problem.patterns', ['arrays-hashing'])
            ->where('problem.leetcodeUrl', 'https://leetcode.com/problems/two-sum/')
            ->where('problem.companies', [])
            ->has('logs', 0));
});

it('returns 404 for a non-existent problem', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/problems/does-not-exist')->assertNotFound();
});

it('renders only the current user logs for a problem', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'two-sum']);

    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $problem->id,
        'status' => 'Optimal',
        'notes' => 'Clean solve',
    ]);

    Log::factory()->create([
        'user_id' => $other->id,
        'problem_id' => $problem->id,
        'status' => 'Failed',
    ]);

    $this->actingAs($user)->get('/problems/two-sum')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('problem')
            ->has('logs', 1)
            ->where('logs.0.status', 'Optimal')
            ->where('logs.0.notes', 'Clean solve'));
});
