<?php

declare(strict_types=1);

use FastRoute\RouteCollector;
use NeowolfAdmin\Controller\LayoutController;
use NeowolfAdmin\Controller\PageController;
use NeowolfAdmin\Controller\SettingController;
use NeowolfAdmin\Controller\SnippetController;
use NeowolfAdmin\Controller\UserController;

return static function (RouteCollector $routes): void {
    $routes->get('/', [PageController::class, 'index']);
    $routes->get('/page/add/{parent_id:\d+}', [PageController::class, 'add']);
    $routes->get('/page/edit/{id:\d+}', [PageController::class, 'edit']);

    $routes->get('/layout', [LayoutController::class, 'index']);
    $routes->get('/layout/add', [LayoutController::class, 'add']);
    $routes->get('/layout/edit/{id:\d+}', [LayoutController::class, 'edit']);

    $routes->get('/snippet', [SnippetController::class, 'index']);
    $routes->get('/snippet/add', [SnippetController::class, 'add']);
    $routes->get('/snippet/edit/{id:\d+}', [SnippetController::class, 'edit']);

    $routes->get('/user', [UserController::class, 'index']);
    $routes->get('/user/add', [UserController::class, 'add']);
    $routes->get('/user/edit/{id:\d+}', [UserController::class, 'edit']);

    $routes->get('/setting', [SettingController::class, 'index']);
};