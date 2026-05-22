<?php

use App\Services\CompanyMatchScorer;

it('can be instantiated', function () {
    expect(new CompanyMatchScorer)->toBeInstanceOf(CompanyMatchScorer::class);
});
