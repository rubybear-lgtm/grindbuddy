<?php

use App\Models\Company;
use App\Models\Log;
use App\Models\Problem;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('requires authentication for the analytics page', function () {
    $this->get('/analytics')->assertRedirect(route('login'));
});

it('requires authentication for the skill match eval page', function () {
    $this->get('/analytics/skill-match-eval')->assertRedirect(route('login'));
});

it('renders skill match eval with companies', function () {
    $user = User::factory()->create();
    Company::factory()->create(['id' => 'google', 'name' => 'Google', 'slug' => 'google', 'color' => '#4285f4']);

    $this->actingAs($user)->get('/analytics/skill-match-eval')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('analytics/skill-match-eval')
            ->has('companies', 1)
            ->where('companies.0.id', 'google')
            ->where('companies.0.name', 'Google')
            ->where('companies.0.slug', 'google')
            ->where('companies.0.color', '#4285f4'));
});

it('renders analytics with catalog props and empty logs for fresh users', function () {
    $user = User::factory()->create();
    Company::factory()->create(['id' => 'google', 'name' => 'Google', 'slug' => 'google', 'color' => '#4285f4']);

    $this->actingAs($user)->get('/analytics')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('analytics')
            ->has('companies', 1)
            ->where('companies.0.id', 'google')
            ->where('companies.0.name', 'Google')
            ->where('companies.0.slug', 'google')
            ->where('companies.0.color', '#4285f4')
            ->has('logs', 0));
});

it('renders analytics with user logs', function () {
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

    $this->actingAs($user)->get('/analytics')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('analytics')
            ->has('logs', 1)
            ->where('logs.0.problem_id', 'two-sum')
            ->where('logs.0.status', 'clean')
            ->where('logs.0.time_complexity', 'O(n)')
            ->where('logs.0.space_complexity', 'O(n)')
            ->where('logs.0.notes', 'Good'));
});
