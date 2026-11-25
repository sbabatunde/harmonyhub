<?php

namespace Modules\Chat\App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcastNow
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public function __construct(public int $messageId, public int $roomId) {}

  public function broadcastOn(): array
  {
    return [new PrivateChannel('chat.room.' . $this->roomId)];
  }

  public function broadcastAs(): string
  {
    return 'message.deleted';
  }

  public function broadcastWith(): array
  {
    return ['id' => $this->messageId, 'room_id' => $this->roomId];
  }
}
