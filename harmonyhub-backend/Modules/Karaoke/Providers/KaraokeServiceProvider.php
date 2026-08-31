<?php

namespace Modules\Karaoke\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Karaoke\app\Services\Contracts\KaraokeServiceInterface;
use Modules\Karaoke\app\Services\KaraokeService;
use Nwidart\Modules\Support\ModuleServiceProvider;

class KaraokeServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Karaoke';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'karaoke';

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

    public function register(): void
    {
        parent::register();
        $this->app->bind(KaraokeServiceInterface::class, KaraokeService::class);
    }
}
