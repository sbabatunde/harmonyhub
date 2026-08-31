<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('song_parts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained()->onDelete('cascade');
            $table->string('part_type');
            $table->string('audio_file_path')->nullable();
            $table->string('sheet_music_path')->nullable();
            $table->string('midi_file_path')->nullable();
            $table->timestamps();

            $table->unique(['song_id', 'part_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('song_parts');
    }
};
