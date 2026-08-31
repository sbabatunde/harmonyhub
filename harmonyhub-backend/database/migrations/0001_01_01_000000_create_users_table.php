<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // HarmonyHub specific fields
            $table->string('role')->default('student');
            $table->string('vocal_range_low')->nullable();
            $table->string('vocal_range_high')->nullable();
            $table->string('voice_part')->default('unknown');
            $table->string('age_bracket')->nullable();
            $table->boolean('is_minor')->default(false);
            $table->string('guardian_email')->nullable();

            $table->foreignId('church_id')->nullable()->constrained()->onDelete('cascade');

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
