<?php

namespace Database\Seeders;

use App\Models\CurriculumStage;
use Illuminate\Database\Seeder;

class CurriculumStageSeeder extends Seeder
{
    public function run(): void
    {
        $stages = [
            [
                'order' => 1,
                'name' => 'Breath Control Basics',
                'description' => 'Learn proper breathing techniques for singing',
                'required_accuracy' => 70,
            ],
            [
                'order' => 2,
                'name' => 'Pitch Matching Fundamentals',
                'description' => 'Match single notes accurately',
                'required_accuracy' => 70,
            ],
            [
                'order' => 3,
                'name' => 'Major Scale Patterns',
                'description' => 'Sing major scales with proper intonation',
                'required_accuracy' => 75,
            ],
            [
                'order' => 4,
                'name' => 'Interval Recognition',
                'description' => 'Identify and sing common intervals',
                'required_accuracy' => 75,
            ],
            [
                'order' => 5,
                'name' => 'Harmony Parts',
                'description' => 'Sing harmony against a lead melody',
                'required_accuracy' => 80,
            ],
        ];

        foreach ($stages as $stage) {
            CurriculumStage::create($stage);
        }
    }
}
