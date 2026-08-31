<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_stages', function (Blueprint $table) {
            $table->id();
            $table->integer('order')->unique();
            $table->string('name');
            $table->text('description');
            $table->integer('required_accuracy')->default(70);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_stages');
    }
};
