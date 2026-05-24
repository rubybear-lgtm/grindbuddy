<?php

use App\Models\Log;
use App\Models\Problem;
use App\Models\User;

it('requires authentication for the problem match endpoint', function () {
    $this->postJson('/api/problem-match', [
        'source' => 'leetcode',
        'url' => 'https://leetcode.com/problems/two-sum/',
        'title' => 'Two Sum',
        'number' => 1,
        'slug' => 'two-sum',
    ])->assertUnauthorized();
});

it('returns the exact problem match for a leetcode url', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'difficulty' => 'Easy',
        'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
    ]);

    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $problem->id,
        'status' => 'Optimal',
    ]);

    $this->actingAs($user)
        ->postJson('/api/problem-match', [
            'source' => 'leetcode',
            'url' => 'https://leetcode.com/problems/two-sum/',
            'title' => 'Two Sum',
            'number' => 1,
            'slug' => 'two-sum',
        ])
        ->assertOk()
        ->assertJsonPath('match.id', 'two-sum')
        ->assertJsonPath('match.number', 1)
        ->assertJsonPath('match.title', 'Two Sum')
        ->assertJsonPath('match.difficulty', 'Easy')
        ->assertJsonPath('match.lastLog.status', 'Optimal')
        ->assertJsonPath('matchType', 'url');
});

it('returns the exact problem match from a normalized title and number', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'difficulty' => 'Easy',
        'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
    ]);

    $this->actingAs($user)
        ->postJson('/api/problem-match', [
            'source' => 'leetcode',
            'url' => 'https://leetcode.com/problems/two-sum/description/',
            'title' => '1. Two Sum',
            'number' => 1,
            'slug' => null,
        ])
        ->assertOk()
        ->assertJsonPath('match.id', $problem->id)
        ->assertJsonPath('matchType', 'number_title');
});

it('returns null match when the page is not an exact catalog hit', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/problem-match', [
            'source' => 'neetcode',
            'url' => 'https://neetcode.io/problems/not-in-catalog',
            'title' => 'Not In Catalog',
            'number' => 999,
            'slug' => 'not-in-catalog',
        ])
        ->assertOk()
        ->assertExactJson([
            'match' => null,
            'matchType' => null,
        ]);
});

it('allows extension origins on problem match requests', function () {
    $user = User::factory()->create();
    Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
    ]);

    $this->actingAs($user)
        ->withHeader('Origin', 'chrome-extension://testextensionid')
        ->postJson('/api/problem-match', [
            'source' => 'leetcode',
            'url' => 'https://leetcode.com/problems/two-sum/',
            'title' => 'Two Sum',
            'number' => 1,
            'slug' => 'two-sum',
        ])
        ->assertOk()
        ->assertHeader('Access-Control-Allow-Origin', 'chrome-extension://testextensionid')
        ->assertHeader('Access-Control-Allow-Credentials', 'true');
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
