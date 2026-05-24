<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Problem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanyProblem>
 */
class CompanyProblemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'problem_id' => Problem::factory(),
            'frequency' => fake()->numberBetween(0, 50),
            'timeframe' => fake()->randomElement(['30 days', '3 months', '6 months', 'all']),
        ];
    }
}
