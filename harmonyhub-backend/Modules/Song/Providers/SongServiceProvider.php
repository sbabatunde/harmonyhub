<?php

namespace Modules\Song\Providers;

use App\Support\Services\Contracts\FileUploadServiceInterface;
use App\Support\Services\FileUploadService;
use Illuminate\Console\Scheduling\Schedule;
use Modules\Song\app\Services\Contracts\SongPartServiceInterface;
use Modules\Song\app\Services\Contracts\SongServiceInterface;
use Modules\Song\app\Services\SongPartService;
use Modules\Song\app\Services\SongService;
use Nwidart\Modules\Support\ModuleServiceProvider;

class SongServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Song';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'song';

    /**
     * Command classes to register.
     *
     * @var string[]
     */
    // protected array $commands = [];

    /**
     * Provider classes to register.
     *
     * @var string[]
     */
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    /**
     * Define module schedules.
     * 
     * @param $schedule
     */
    // protected function configureSchedules(Schedule $schedule): void
    // {
    //     $schedule->command('inspire')->hourly();
    // }

    /**
     * Register services.
     */
    public function register(): void
    {
        parent::register();

        $this->app->bind(SongServiceInterface::class, SongService::class);
        $this->app->bind(SongPartServiceInterface::class, SongPartService::class);
    }
}
