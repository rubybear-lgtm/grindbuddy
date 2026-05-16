<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['id', 'name', 'slug', 'color'])]
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    /**
     * @return BelongsToMany<Problem, $this>
     */
    public function problems(): BelongsToMany
    {
        return $this->belongsToMany(Problem::class, 'company_problems')
            ->using(CompanyProblem::class)
            ->withPivot(['frequency', 'timeframe']);
    }
}
