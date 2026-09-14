<?php

declare(strict_types=1);

use FastRoute\Dispatcher;
use NeowolfAdmin\Controller\Controller;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

require dirname(__DIR__) . '/vendor/autoload.php';

$projectRoot = dirname(__DIR__);

$twig = new Environment(
    new FilesystemLoader($projectRoot . '/templates'),
    [
        'cache' => false,
        'strict_variables' => true,
    ]
);

$navigationFile = $projectRoot . '/data/navigation.json';
$navigationJson = file_get_contents($navigationFile);

if ($navigationJson === false) {
    throw new RuntimeException(
        'Could not read fixture: navigation'
    );
}

$twig->addGlobal(
    'navigation',
    json_decode(
        $navigationJson,
        true,
        512,
        JSON_THROW_ON_ERROR
    )
);

$dispatcher = FastRoute\simpleDispatcher(
    require $projectRoot . '/src/routes.php'
);

$uri = rawurldecode(
    (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH)
);

$route = $dispatcher->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    $uri
);

switch ($route[0]) {
    case Dispatcher::NOT_FOUND:
        http_response_code(404);
        echo $twig->render('404.twig');
        break;

    case Dispatcher::METHOD_NOT_ALLOWED:
        http_response_code(405);
        header('Allow: ' . implode(', ', $route[1]));
        echo $twig->render('405.twig');
        break;

    case Dispatcher::FOUND:
        [$controllerClass, $method] = $route[1];

        /** @var Controller $controller */
        $controller = new $controllerClass($twig, $projectRoot);
        $controller->{$method}($route[2]);
        break;
}