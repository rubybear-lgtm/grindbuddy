<?php

use App\Models\Log;
use App\Models\Problem;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for the logbook page', function () {
    $this->get('/logbook')->assertRedirect(route('login'));
});

it('renders logbook with catalog props and empty logs for fresh users', function () {
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

    $this->actingAs($user)->get('/logbook')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('logbook')
            ->has('problems', 1)
            ->where('problems.0.id', 'two-sum')
            ->where('problems.0.number', 1)
            ->where('problems.0.title', 'Two Sum')
            ->where('problems.0.difficulty', 'Easy')
            ->where('problems.0.patterns', ['arrays-hashing'])
            ->where('problems.0.neetcodeUrl', null)
            ->where('problems.0.leetcodeUrl', 'https://leetcode.com/problems/two-sum/')
            ->where('selectedProblemId', null)
            ->has('logs', 0));
});

it('renders logbook with user logs', function () {
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

    $this->actingAs($user)->get('/logbook')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('logbook')
            ->has('logs', 1)
            ->where('logs.0.problem_id', 'two-sum')
            ->where('logs.0.status', 'clean')
            ->where('logs.0.time_complexity', 'O(n)')
            ->where('logs.0.space_complexity', 'O(n)')
            ->where('logs.0.notes', 'Good'));
});

it('passes the selected problem id from the query string', function () {
    $user = User::factory()->create();
    Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'difficulty' => 'Easy',
    ]);

    $this->actingAs($user)->get('/logbook?problemId=two-sum')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('logbook')
            ->where('selectedProblemId', 'two-sum'));
});
