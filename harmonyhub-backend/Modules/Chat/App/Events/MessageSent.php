<?php

namespace Modules\Chat\App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public function __construct(public ChatMessage $message) {}

  public function broadcastOn(): array
  {
    return [new PrivateChannel('chat.room.' . $this->message->room_id)];
  }

  public function broadcastAs(): string
  {
    return 'message.sent';
  }

  public function broadcastWith(): array
  {
    return $this->message->load('sender')->toClientArray();
  }
}
