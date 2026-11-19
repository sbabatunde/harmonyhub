<?php

namespace App\Providers;

use App\Support\Services\Contracts\FileUploadServiceInterface;
use App\Support\Services\FileUploadService;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(FileUploadServiceInterface::class, FileUploadService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // $channelPaths = [
        //     base_path('routes/channels.php'),
        //     base_path('Modules/Chat/routes/channels.php'),
        //     base_path('Modules/Chat/Routes/channels.php'),
        // ];

        // foreach ($channelPaths as $path) {
        //     if (file_exists($path)) {
        //         require $path;
        //     }
        // }
    }
}
