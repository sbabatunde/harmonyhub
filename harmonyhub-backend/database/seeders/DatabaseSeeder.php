<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ChurchSeeder::class,
            CurriculumStageSeeder::class,
            UserSeeder::class,
        ]);
    }
}
