<?php

return [
    'name' => 'Karaoke',
    'ai_service_url' => env('AI_SERVICE_URL', 'http://localhost:8001'),
    'webhook_secret' => env('LARAVEL_WEBHOOK_SECRET', ''),
];
