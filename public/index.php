<?php

declare(strict_types=1);

use FastRoute\Dispatcher;
use NeowolfAdmin\Controller\Controller;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;
use Twig\TwigFunction;

require dirname(__DIR__) . '/vendor/autoload.php';

$projectRoot = dirname(__DIR__);

$twig = new Environment(
    new FilesystemLoader($projectRoot . '/templates'),
    [
        'cache' => false,
        'strict_variables' => true,
    ]
);

$twig->addFunction(
    new TwigFunction(
        'asset',
        static function (string $path) use ($projectRoot): string {
            $path = ltrim($path, '/');
            $file = $projectRoot . '/public/' . $path;

            if (!is_file($file)) {
                return '/' . $path;
            }

            return '/' . $path . '?v=' . filemtime($file);
        }
    )
);

$navigationFile = $projectRoot . '/data/navigation.json';
$navigationJson = file_get_contents($navigationFile);

if ($navigationJson === false) {
    throw new RuntimeException(
        'Could not read fixture: navigation'
    );
}

$navigation = json_decode(
    $navigationJson,
    true,
    512,
    JSON_THROW_ON_ERROR
);

/*
 * Resolve the standard navigation icons.
 */
foreach ($navigation as &$group) {
    foreach ($group['items'] as &$item) {
        $item['icon'] = '/assets/icons/plugins/' . $item['icon'];
    }

    unset($item);
}

unset($group);

$pluginsFile = $projectRoot . '/data/plugins.json';
$pluginsJson = file_get_contents($pluginsFile);

if ($pluginsJson === false) {
    throw new RuntimeException(
        'Could not read fixture: plugins'
    );
}

$plugins = json_decode(
    $pluginsJson,
    true,
    512,
    JSON_THROW_ON_ERROR
);

/*
 * Add the Example Plugin to the main navigation when enabled and configured
 * to be shown there.
 */
foreach ($plugins as $plugin) {
    if (
        $plugin['id'] !== 'example'
        || !$plugin['enabled']
        || !$plugin['show_in_navigation']
    ) {
        continue;
    }

    $icon = '/assets/icons/plugins/puzzle.svg';
    $iconFile = $projectRoot . '/templates/plugin/icon.svg';

    if (is_file($iconFile)) {
        $svg = file_get_contents($iconFile);

        if ($svg !== false) {
            $icon = 'data:image/svg+xml;base64,' . base64_encode($svg);
        }
    }

    foreach ($navigation as &$group) {
        if ($group['section'] !== 'Plugins') {
            continue;
        }

        $group['items'][] = [
            'id' => $plugin['id'],
            'label' => $plugin['name'],
            'href' => '/plugin',
            'icon' => $icon,
        ];

        break;
    }

    unset($group);

    break;
}

$twig->addGlobal('navigation', $navigation);

$dispatcher = FastRoute\simpleDispatcher(
    require $projectRoot . '/src/routes.php'
);

$uri = rawurldecode(
    (string) parse_url(
        $_SERVER['REQUEST_URI'] ?? '/',
        PHP_URL_PATH
    )
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
        $controller = new $controllerClass(
            $twig,
            $projectRoot
        );

        $controller->{$method}($route[2]);
        break;
}