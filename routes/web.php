<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CompanyMatchController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\ProblemMatchController;
use App\Http\Controllers\Auth\DevLoginController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LogbookController;
use App\Http\Controllers\ProblemController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/api/health', [HealthController::class, 'index']);

Route::get('/api/companies', [CompanyController::class, 'index']);
Route::get('/api/companies/{company:slug}', [CompanyController::class, 'show']);

Route::middleware(['auth'])->group(function () {
    Route::get('/api/companies/{company:slug}/match', CompanyMatchController::class);
    Route::post('/api/problem-match', ProblemMatchController::class);

    Route::get('/api/logs', [LogController::class, 'index']);
    Route::post('/api/logs', [LogController::class, 'store']);
    Route::put('/api/logs/{log}', [LogController::class, 'update']);
    Route::delete('/api/logs/{log}', [LogController::class, 'destroy']);

    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/logbook', LogbookController::class)->name('logbook');
    Route::get('/problems/{problem}', [ProblemController::class, 'show'])->name('problem.show');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics');
    Route::get('/analytics/skill-match-eval', [AnalyticsController::class, 'skillMatchEval'])->name('analytics.skill-match-eval');
});

Route::inertia('/login', 'auth/login')->name('login');

Route::match(['post'], '/login', fn () => abort(404));

if (app()->isLocal()) {
    Route::get('/dev-login', DevLoginController::class)->name('dev-login');
}

Route::get('/auth/{provider}', [OAuthController::class, 'redirect'])
    ->name('oauth.redirect')
    ->whereIn('provider', config('services.socialite.providers'));

Route::get('/auth/{provider}/callback', [OAuthController::class, 'callback'])
    ->name('oauth.callback')
    ->whereIn('provider', config('services.socialite.providers'));

require __DIR__.'/settings.php';
