<?php

it('returns plain ok for health checks', function () {
    $this->get('/api/health')
        ->assertOk()
        ->assertSeeText('OK');
});

it('returns debug json outside production when requested', function () {
    $this->getJson('/api/health?debug=1', ['Origin' => 'https://example.com'])
        ->assertOk()
        ->assertJsonStructure([
            'url', 'origin', 'host', 'originHeader', 'referer', 'forwardedHost', 'forwardedProto', 'headers',
        ])
        ->assertJsonPath('originHeader', 'https://example.com');
});

it('does not return debug json in production', function () {
    app()->detectEnvironment(fn () => 'production');

    $this->get('/api/health?debug=1')
        ->assertOk()
        ->assertSeeText('OK');
});
