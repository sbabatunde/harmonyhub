<?php

namespace Modules\Chat\App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcastNow
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public function __construct(
    public int $roomId,
    public int $userId,
    public string $userName,
    public bool $typing = true,
  ) {}

  public function broadcastOn(): array
  {
    return [new PrivateChannel('chat.room.' . $this->roomId)];
  }

  public function broadcastAs(): string
  {
    return 'user.typing';
  }

  public function broadcastWith(): array
  {
    return [
      'room_id'   => $this->roomId,
      'user_id'   => $this->userId,
      'user_name' => $this->userName,
      'typing'    => $this->typing,
    ];
  }
}
