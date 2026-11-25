<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('chat_room_members', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('last_read_at');
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->foreignId('reply_to_id')
                ->nullable()
                ->after('sender_id')
                ->constrained('chat_messages')
                ->nullOnDelete();

            $table->foreignId('forwarded_from_id')
                ->nullable()
                ->after('reply_to_id')
                ->constrained('chat_messages')
                ->nullOnDelete();

            $table->foreignId('song_id')
                ->nullable()
                ->after('content')
                ->constrained('songs')
                ->nullOnDelete();

            $table->timestamp('edited_at')->nullable()->after('updated_at');
            $table->timestamp('pinned_at')->nullable()->after('edited_at');
            $table->foreignId('pinned_by')
                ->nullable()
                ->after('pinned_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropConstrainedForeignId('pinned_by');
            $table->dropColumn('pinned_at');
            $table->dropColumn('edited_at');
            $table->dropConstrainedForeignId('song_id');
            $table->dropConstrainedForeignId('forwarded_from_id');
            $table->dropConstrainedForeignId('reply_to_id');
        });

        Schema::table('chat_room_members', function (Blueprint $table) {
            $table->dropColumn('last_seen_at');
        });
    }
};
