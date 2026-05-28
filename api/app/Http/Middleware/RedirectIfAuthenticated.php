<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated as Middleware;

class RedirectIfAuthenticated extends Middleware
{
    /**
     * Handle an incoming request.
     */
    public function handle($request, callable $next, ...$guards)
    {
        return $next($request);
    }
}
