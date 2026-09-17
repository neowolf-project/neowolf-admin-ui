<?php

declare(strict_types=1);

use FastRoute\RouteCollector;
use NeowolfAdmin\Controller\LayoutController;
use NeowolfAdmin\Controller\PageController;
use NeowolfAdmin\Controller\SnippetController;

return static function (RouteCollector $routes): void {
    $routes->get('/', [PageController::class, 'index']);
    $routes->get('/page/edit[/{id:\d+}]', [PageController::class, 'edit']);

    $routes->get('/layout', [LayoutController::class, 'index']);
    $routes->get('/layout/edit/{id:\d+}', [LayoutController::class, 'edit']);

    $routes->get('/snippet', [SnippetController::class, 'index']);
    $routes->get('/snippet/edit/{id:\d+}', [SnippetController::class, 'edit']);
};