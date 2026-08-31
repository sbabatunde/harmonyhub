<?php

namespace Modules\Assignment\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Assignment\app\Services\AssignmentService;
use Modules\Assignment\app\Services\Contracts\AssignmentServiceInterface;
use Nwidart\Modules\Support\ModuleServiceProvider;

class AssignmentServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Assignment';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'assignment';

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

        $this->app->bind(AssignmentServiceInterface::class, AssignmentService::class);
    }
}
