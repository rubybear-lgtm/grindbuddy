<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    public function redirect(string $provider): RedirectResponse
    {
        $this->ensureSupportedProvider($provider);

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->ensureSupportedProvider($provider);

        $socialiteUser = Socialite::driver($provider)->user();
        $email = $socialiteUser->getEmail();

        abort_if($email === null, 422, 'OAuth provider did not return an email address.');

        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_user_id', $socialiteUser->getId())
            ->first();

        $user = $socialAccount?->user ?? User::create([
            'name' => $socialiteUser->getName() ?? $socialiteUser->getNickname() ?? $email,
            'email' => $email,
            'password' => null,
        ]);

        if ($socialAccount === null) {
            $user->socialAccounts()->create([
                'provider' => $provider,
                'provider_user_id' => $socialiteUser->getId(),
                'provider_email' => $email,
                'avatar_url' => $socialiteUser->getAvatar(),
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    private function ensureSupportedProvider(string $provider): void
    {
        abort_unless(in_array($provider, config('services.socialite.providers', []), true), 404);
    }
}
