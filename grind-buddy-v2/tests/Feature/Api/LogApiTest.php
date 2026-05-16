<?php

use App\Models\Log;
use App\Models\Problem;
use App\Models\User;

it('requires authentication for log routes', function () {
    $problem = Problem::factory()->create(['id' => 'two-sum']);

    $this->getJson('/api/logs')->assertUnauthorized();
    $this->postJson('/api/logs', ['problemId' => $problem->id, 'status' => 'Optimal'])->assertUnauthorized();
});

it('creates a log for the authenticated user', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'two-sum']);

    $response = $this->actingAs($user)->postJson('/api/logs', [
        'problemId' => $problem->id,
        'status' => 'Optimal',
        'timeComplexity' => 'O(n)',
        'spaceComplexity' => 'O(1)',
        'notes' => 'Hash map pass',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('log.problemId', 'two-sum')
        ->assertJsonPath('log.status', 'Optimal')
        ->assertJsonPath('log.timeComplexity', 'O(n)')
        ->assertJsonPath('log.spaceComplexity', 'O(1)')
        ->assertJsonPath('log.notes', 'Hash map pass')
        ->assertJsonStructure(['success', 'log' => ['id', 'problemId', 'status', 'timeComplexity', 'spaceComplexity', 'notes', 'timestamp']]);

    $this->assertDatabaseHas('logs', [
        'user_id' => $user->id,
        'problem_id' => 'two-sum',
        'status' => 'Optimal',
        'time_complexity' => 'O(n)',
        'space_complexity' => 'O(1)',
        'notes' => 'Hash map pass',
    ]);
});

it('lists only logs owned by the authenticated user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'merge-intervals']);

    $ownLog = Log::factory()->create(['user_id' => $user->id, 'problem_id' => $problem->id, 'status' => 'Optimal']);
    Log::factory()->create(['user_id' => $otherUser->id, 'problem_id' => $problem->id]);

    $response = $this->actingAs($user)->getJson('/api/logs');

    $response->assertOk()->assertExactJson([
        [
            'id' => $ownLog->id,
            'problemId' => 'merge-intervals',
            'status' => 'Optimal',
            'timeComplexity' => $ownLog->time_complexity,
            'spaceComplexity' => $ownLog->space_complexity,
            'notes' => $ownLog->notes,
            'timestamp' => $ownLog->timestamp->toJSON(),
        ],
    ]);
});

it('updates only logs owned by the authenticated user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'longest-substring']);
    $ownLog = Log::factory()->create(['user_id' => $user->id, 'problem_id' => $problem->id]);
    $otherLog = Log::factory()->create(['user_id' => $otherUser->id, 'problem_id' => $problem->id, 'status' => 'Failed']);

    $this->actingAs($user)->putJson("/api/logs/{$otherLog->id}", ['status' => 'Optimal'])->assertNotFound();

    $response = $this->actingAs($user)->putJson("/api/logs/{$ownLog->id}", [
        'status' => 'Suboptimal',
        'timeComplexity' => 'O(n)',
        'spaceComplexity' => 'O(n)',
        'notes' => 'Sliding window',
    ]);

    $response->assertOk()->assertExactJson(['success' => true]);
    $this->assertDatabaseHas('logs', [
        'id' => $ownLog->id,
        'user_id' => $user->id,
        'status' => 'Suboptimal',
        'time_complexity' => 'O(n)',
        'space_complexity' => 'O(n)',
        'notes' => 'Sliding window',
    ]);
    $this->assertDatabaseHas('logs', ['id' => $otherLog->id, 'status' => 'Failed']);
});

it('deletes only logs owned by the authenticated user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $problem = Problem::factory()->create(['id' => 'binary-search']);
    $ownLog = Log::factory()->create(['user_id' => $user->id, 'problem_id' => $problem->id]);
    $otherLog = Log::factory()->create(['user_id' => $otherUser->id, 'problem_id' => $problem->id]);

    $this->actingAs($user)->deleteJson("/api/logs/{$otherLog->id}")->assertNotFound();

    $this->actingAs($user)->deleteJson("/api/logs/{$ownLog->id}")->assertNoContent();

    $this->assertDatabaseMissing('logs', ['id' => $ownLog->id]);
    $this->assertDatabaseHas('logs', ['id' => $otherLog->id]);
});
