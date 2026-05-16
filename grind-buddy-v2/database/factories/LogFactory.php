<?php

namespace Database\Factories;

use App\Models\Log;
use App\Models\Problem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Log>
 */
class LogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'problem_id' => Problem::factory(),
            'status' => fake()->randomElement(['solved', 'attempted', 'reviewed']),
            'time_complexity' => fake()->optional()->randomElement(['O(1)', 'O(n)', 'O(n log n)', 'O(n^2)']),
            'space_complexity' => fake()->optional()->randomElement(['O(1)', 'O(n)']),
            'notes' => fake()->optional()->sentence(),
            'timestamp' => fake()->dateTimeThisYear(),
        ];
    }
}
