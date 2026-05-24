<?php

use App\Models\User;
use Laravel\Fortify\Features;

test('email/password Fortify features are disabled in config', function () {
    expect(Features::enabled(Features::registration()))->toBeFalse();
    expect(Features::enabled(Features::resetPasswords()))->toBeFalse();
    expect(Features::enabled(Features::emailVerification()))->toBeFalse();
    expect(Features::enabled(Features::twoFactorAuthentication()))->toBeFalse();
});

test('GET /login is reachable as an Inertia page', function () {
    $response = $this->get('/login');

    expect($response->status())->toBe(200);
});

test('POST /login is rejected', function () {
    $response = $this->post('/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ]);

    expect($response->status())->toBeIn([404, 405, 302]);
    $this->assertGuest();
});

test('GET /register returns 404 or redirects away', function () {
    $response = $this->get('/register');

    expect($response->status())->toBeIn([404, 302]);

    if ($response->status() === 302) {
        expect($response->headers->get('Location'))
            ->not->toContain('/register');
    }
});

test('POST /register is rejected', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect($response->status())->toBeIn([404, 405, 302]);
    $this->assertGuest();
});

test('GET /forgot-password returns 404 or redirects away', function () {
    $response = $this->get('/forgot-password');

    expect($response->status())->toBeIn([404, 302]);
});

test('POST /forgot-password is rejected', function () {
    $response = $this->post('/forgot-password', [
        'email' => 'test@example.com',
    ]);

    expect($response->status())->toBeIn([404, 405, 302]);
});

test('GET /reset-password/{token} returns 404 or redirects away', function () {
    $response = $this->get('/reset-password/some-token');

    expect($response->status())->toBeIn([404, 302]);
});

test('POST /reset-password is rejected', function () {
    $response = $this->post('/reset-password', [
        'token' => 'some-token',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect($response->status())->toBeIn([404, 405, 302]);
});

test('GET /email/verify returns 404 or redirects away', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->get('/email/verify');

    expect($response->status())->toBeIn([404, 302]);
});

test('POST /email/verification-notification is rejected', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->post('/email/verification-notification');

    expect($response->status())->toBeIn([404, 405, 302]);
});

test('GET /two-factor-challenge returns 404 or redirects away', function () {
    $response = $this->get('/two-factor-challenge');

    expect($response->status())->toBeIn([404, 302]);
});

test('POST /two-factor-challenge is rejected', function () {
    $response = $this->post('/two-factor-challenge', [
        'code' => '123456',
    ]);

    expect($response->status())->toBeIn([404, 405, 302]);
});

test('authenticated users can still log out via POST /logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    expect($response->status())->toBeIn([200, 204, 302]);
});

test('logout route is registered and intact', function () {
    $route = app('router')->getRoutes()->getByName('logout');

    expect($route)->not->toBeNull();
    expect($route->uri())->toBe('logout');
    expect($route->methods())->toContain('POST');
});
