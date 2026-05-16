<?php

namespace Database\Factories;

use App\Models\Problem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Problem>
 */
class ProblemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = fake()->unique()->slug(3);

        return [
            'id' => $slug,
            'number' => fake()->unique()->numberBetween(1, 9999),
            'title' => fake()->unique()->sentence(3),
            'difficulty' => fake()->randomElement(['Easy', 'Medium', 'Hard']),
            'patterns' => fake()->randomElements(
                ['arrays-hashing', 'two-pointers', 'sliding-window', 'stack', 'graphs', 'dp'],
                fake()->numberBetween(1, 3)
            ),
            'neetcode_url' => fake()->optional()->url(),
            'leetcode_url' => 'https://leetcode.com/problems/'.$slug.'/',
        ];
    }
}
