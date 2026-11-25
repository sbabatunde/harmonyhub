<?php

namespace Modules\Chat\App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\ChatMessage;

class MessageUpdated implements ShouldBroadcastNow
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public function __construct(public ChatMessage $message) {}

  public function broadcastOn(): array
  {
    return [new PrivateChannel('chat.room.' . $this->message->room_id)];
  }

  public function broadcastAs(): string
  {
    return 'message.updated';
  }

  public function broadcastWith(): array
  {
    return $this->message->toClientArray();
  }
}
