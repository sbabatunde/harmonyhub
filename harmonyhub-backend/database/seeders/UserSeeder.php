<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Church;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $church = Church::first();

        User::create([
            'name' => 'Admin User',
            'email' => 'admin@harmonyhub.test',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'voice_part' => 'tenor',
            'church_id' => $church->id,
        ]);

        User::create([
            'name' => 'Teacher User',
            'email' => 'teacher@harmonyhub.test',
            'password' => Hash::make('password123'),
            'role' => 'teacher',
            'voice_part' => 'soprano',
            'church_id' => $church->id,
        ]);

        User::create([
            'name' => 'Student User',
            'email' => 'student@harmonyhub.test',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'voice_part' => 'alto',
            'church_id' => $church->id,
        ]);
    }
}
