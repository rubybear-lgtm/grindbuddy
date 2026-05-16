<?php

namespace App\Models;

use Database\Factories\ProblemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['id', 'number', 'title', 'difficulty', 'patterns', 'neetcode_url', 'leetcode_url'])]
class Problem extends Model
{
    /** @use HasFactory<ProblemFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    /**
     * @return BelongsToMany<Company, $this>
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_problems')
            ->using(CompanyProblem::class)
            ->withPivot(['frequency', 'timeframe']);
    }

    /**
     * @return HasMany<Log, $this>
     */
    public function logs(): HasMany
    {
        return $this->hasMany(Log::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'patterns' => 'array',
            'number' => 'integer',
        ];
    }
}
