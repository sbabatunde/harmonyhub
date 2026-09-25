<?php

namespace Modules\Teacher\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Illuminate\Console\Scheduling\Schedule;
use Modules\Teacher\App\Services\TeacherService;
use Modules\Teacher\App\Services\Contracts\TeacherServiceInterface;

class TeacherServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Teacher';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'teacher';

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
     * Register services.
     */
    public function register(): void
    {
        parent::register();

        $this->app->bind(TeacherServiceInterface::class, TeacherService::class);
    }
}
