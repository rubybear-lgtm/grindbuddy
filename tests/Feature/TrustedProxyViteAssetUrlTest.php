<?php

test('vite assets stay https behind the Railway proxy', function () {
    $response = $this
        ->withServerVariables([
            'HTTP_HOST' => 'grindbuddy.xyz',
            'HTTP_X_FORWARDED_HOST' => 'grindbuddy.xyz',
            'HTTP_X_FORWARDED_PORT' => '443',
            'HTTP_X_FORWARDED_PROTO' => 'https',
        ])
        ->get('/login');

    $response->assertOk();
    $response->assertSee('https://grindbuddy.xyz/build', escape: false);
    $response->assertDontSee('http://grindbuddy.xyz/build', escape: false);
});
