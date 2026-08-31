<?php

namespace Database\Seeders;

use App\Models\Church;
use Illuminate\Database\Seeder;

class ChurchSeeder extends Seeder
{
    public function run(): void
    {
        Church::create([
            'name' => 'Grace Community Church',
            'timezone' => 'America/New_York',
            'ccli_license_number' => '1234567',
        ]);
    }
}
