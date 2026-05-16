<?php

use App\Models\Company;
use App\Models\Log;
use App\Models\Problem;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for the dashboard page', function () {
    $this->get('/dashboard')->assertRedirect(route('login'));
});

it('renders dashboard with catalog props and empty logs for fresh users', function () {
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
    Company::factory()->create(['id' => 'google', 'name' => 'Google', 'slug' => 'google', 'color' => '#4285f4']);

    $this->actingAs($user)->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('problems', 1)
            ->where('problems.0.id', 'two-sum')
            ->where('problems.0.number', 1)
            ->where('problems.0.title', 'Two Sum')
            ->where('problems.0.difficulty', 'Easy')
            ->where('problems.0.patterns', ['arrays-hashing'])
            ->where('problems.0.neetcodeUrl', null)
            ->where('problems.0.leetcodeUrl', 'https://leetcode.com/problems/two-sum/')
            ->has('companies', 1)
            ->where('companies.0.id', 'google')
            ->where('companies.0.name', 'Google')
            ->where('companies.0.slug', 'google')
            ->where('companies.0.color', '#4285f4')
            ->has('logs', 0));
});

it('renders dashboard with user logs', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'two-sum']);
    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $problem->id,
        'status' => 'clean',
        'time_complexity' => 'O(n)',
        'space_complexity' => 'O(n)',
        'notes' => 'Good',
    ]);

    $this->actingAs($user)->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('logs', 1)
            ->where('logs.0.problem_id', 'two-sum')
            ->where('logs.0.status', 'clean')
            ->where('logs.0.time_complexity', 'O(n)')
            ->where('logs.0.space_complexity', 'O(n)')
            ->where('logs.0.notes', 'Good'));
});
