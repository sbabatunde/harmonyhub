<?php

namespace Modules\Auth\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Illuminate\Console\Scheduling\Schedule;
use Modules\Auth\App\Services\AuthService;
use Modules\Auth\App\Services\UserService;
use Modules\Auth\App\Services\Contracts\AuthServiceInterface;
use Modules\Auth\App\Services\Contracts\UserServiceInterface;

class AuthServiceProvider extends ModuleServiceProvider
{
    /**
     * The name of the module.
     */
    protected string $name = 'Auth';

    /**
     * The lowercase version of the module name.
     */
    protected string $nameLower = 'auth';

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

        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(UserServiceInterface::class, UserService::class);
    }
}
