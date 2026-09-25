<?php

namespace Modules\Curriculum\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Curriculum\App\Services\Contracts\CurriculumServiceInterface;
use Modules\Curriculum\App\Services\CurriculumService;
use Nwidart\Modules\Support\ModuleServiceProvider;

class CurriculumServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Curriculum';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'curriculum';

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

        $this->app->bind(CurriculumServiceInterface::class, CurriculumService::class);
    }
}
