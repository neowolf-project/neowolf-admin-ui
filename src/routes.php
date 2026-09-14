<?php

declare(strict_types=1);

use FastRoute\RouteCollector;
use NeowolfAdmin\Controller\LayoutController;
use NeowolfAdmin\Controller\PageController;

return static function (RouteCollector $routes): void {
    $routes->get('/', [PageController::class, 'index']);

    $routes->get('/layout', [LayoutController::class, 'index']);
    $routes->get('/layout/{id:\d+}/edit', [LayoutController::class, 'edit']);
};
