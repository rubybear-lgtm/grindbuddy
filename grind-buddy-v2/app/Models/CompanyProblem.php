<?php

namespace App\Models;

use Database\Factories\CompanyProblemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Fillable(['company_id', 'problem_id', 'frequency', 'timeframe'])]
class CompanyProblem extends Pivot
{
    /** @use HasFactory<CompanyProblemFactory> */
    use HasFactory;

    protected $table = 'company_problems';

    public $incrementing = true;

    public $timestamps = false;

    /**
     * @return BelongsTo<Company, $this>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * @return BelongsTo<Problem, $this>
     */
    public function problem(): BelongsTo
    {
        return $this->belongsTo(Problem::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'frequency' => 'integer',
        ];
    }
}
