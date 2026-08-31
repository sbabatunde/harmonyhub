<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('songs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('key_signature')->nullable();
            $table->integer('tempo')->nullable();
            $table->integer('difficulty_level')->default(1);
            $table->string('audio_file_path')->nullable();
            $table->string('sheet_music_path')->nullable();
            $table->boolean('is_public_domain')->default(false);
            $table->text('licensing_info')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('church_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('songs');
    }
};
