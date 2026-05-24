<?php

use App\Models\SocialAccount;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;

function fakeSocialite(string $provider, object $user): void
{
    Socialite::fake($provider, $user);
}

function fakeSocialiteUser(?string $email = 'ada@example.com', string $id = 'google-123'): object
{
    return new class($email, $id)
    {
        public function __construct(private readonly ?string $email, private readonly string $id) {}

        public function getId(): string
        {
            return $this->id;
        }

        public function getNickname(): ?string
        {
            return null;
        }

        public function getName(): string
        {
            return 'Ada Lovelace';
        }

        public function getEmail(): ?string
        {
            return $this->email;
        }

        public function getAvatar(): string
        {
            return 'https://example.com/avatar.png';
        }
    };
}

test('redirects to google', function () {
    config()->set('services.google.client_id', 'google-client-id');
    config()->set('services.google.client_secret', 'google-client-secret');
    config()->set('services.google.redirect', 'http://localhost/auth/google/callback');

    $response = $this->get('/auth/google');

    $response->assertRedirectContains('accounts.google.com');
});

test('redirects to github', function () {
    config()->set('services.github.client_id', 'github-client-id');
    config()->set('services.github.client_secret', 'github-client-secret');
    config()->set('services.github.redirect', 'http://localhost/auth/github/callback');

    $response = $this->get('/auth/github');

    $response->assertRedirectContains('github.com');
});

test('signs in new google user', function () {
    fakeSocialite('google', fakeSocialiteUser());

    $response = $this->get('/auth/google/callback');

    $user = User::where('email', 'ada@example.com')->first();

    expect($user)->not->toBeNull();
    $this->assertAuthenticatedAs($user);
    $this->assertDatabaseHas('social_accounts', [
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_user_id' => 'google-123',
        'provider_email' => 'ada@example.com',
        'avatar_url' => 'https://example.com/avatar.png',
    ]);
    $response->assertRedirect('/dashboard');
});

test('signs in returning google user', function () {
    $user = User::factory()->create(['email' => 'existing@example.com']);
    SocialAccount::factory()->for($user)->create([
        'provider' => 'google',
        'provider_user_id' => 'google-123',
        'provider_email' => 'old@example.com',
    ]);
    fakeSocialite('google', fakeSocialiteUser('ada@example.com'));

    $response = $this->get('/auth/google/callback');

    $this->assertAuthenticatedAs($user);
    expect(User::count())->toBe(1);
    $response->assertRedirect('/dashboard');
});

test('rejects unknown provider with 404', function () {
    $this->get('/auth/twitter')->assertNotFound();
});

test('rejects null email user', function () {
    fakeSocialite('google', fakeSocialiteUser(null));

    $response = $this->get('/auth/google/callback');

    $response->assertUnprocessable();
    $this->assertGuest();
    expect(User::count())->toBe(0);
});

test('regenerates session on successful login', function () {
    fakeSocialite('google', fakeSocialiteUser());
    $this->withSession(['oauth_session_probe' => true]);
    $sessionId = session()->getId();

    $this->get('/auth/google/callback');

    expect(session()->getId())->not->toBe($sessionId);
});

test('redirects to dashboard after login', function () {
    fakeSocialite('google', fakeSocialiteUser());

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/dashboard');
});
