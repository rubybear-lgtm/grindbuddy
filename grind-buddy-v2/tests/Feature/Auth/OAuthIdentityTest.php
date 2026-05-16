<?php

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Database\QueryException;

test('social accounts identify returning users by provider identity', function () {
    $user = User::factory()->create(['password' => null]);

    $socialAccount = SocialAccount::factory()
        ->for($user)
        ->create([
            'provider' => 'github',
            'provider_user_id' => 'github-user-123',
            'provider_email' => 'oauth-user@example.com',
        ]);

    $matchedAccount = SocialAccount::query()
        ->where('provider', 'github')
        ->where('provider_user_id', 'github-user-123')
        ->first();

    expect($matchedAccount?->is($socialAccount))->toBeTrue()
        ->and($matchedAccount?->user->is($user))->toBeTrue()
        ->and($user->fresh()->socialAccounts)->toHaveCount(1)
        ->and($user->fresh()->password)->toBeNull();
});

test('duplicate provider identity is rejected', function () {
    SocialAccount::factory()->create([
        'provider' => 'github',
        'provider_user_id' => 'duplicate-provider-user',
    ]);

    expect(fn () => SocialAccount::factory()->create([
        'provider' => 'github',
        'provider_user_id' => 'duplicate-provider-user',
    ]))->toThrow(QueryException::class);
});

test('same provider user id can exist for a different provider', function () {
    SocialAccount::factory()->create([
        'provider' => 'github',
        'provider_user_id' => 'shared-provider-user',
    ]);

    $socialAccount = SocialAccount::factory()->create([
        'provider' => 'google',
        'provider_user_id' => 'shared-provider-user',
    ]);

    expect($socialAccount)->toBeInstanceOf(SocialAccount::class);
});

test('null email oauth users are rejected', function () {
    expect(fn () => User::factory()->create([
        'email' => null,
        'password' => null,
    ]))->toThrow(QueryException::class);
});

test('same email different provider is not auto linked', function () {
    $email = 'shared-oauth@example.com';
    $user = User::factory()->create([
        'email' => $email,
        'password' => null,
    ]);

    SocialAccount::factory()
        ->for($user)
        ->create([
            'provider' => 'github',
            'provider_user_id' => 'github-shared-email',
            'provider_email' => $email,
        ]);

    $providerIdentityMatch = SocialAccount::query()
        ->where('provider', 'google')
        ->where('provider_user_id', 'google-shared-email')
        ->first();

    expect($providerIdentityMatch)->toBeNull();

    expect(fn () => User::factory()->create([
        'email' => $email,
        'password' => null,
    ]))->toThrow(QueryException::class);

    expect($user->fresh()->socialAccounts)->toHaveCount(1);
});
