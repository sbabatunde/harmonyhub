<?php

namespace Modules\Chat\Providers;

use Illuminate\Support\Facades\Gate;
use Modules\Chat\App\Policies\ChatRoomPolicy;
use App\Models\ChatRoom;
use Nwidart\Modules\Support\ModuleServiceProvider;

class ChatServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Chat';
    protected string $nameLower = 'chat';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    public function boot(): void
    {
        parent::boot();

        Gate::policy(ChatRoom::class, ChatRoomPolicy::class);
    }
}
