# Neowolf Admin UI

Minimal PHP 8.5 + Twig + FastRoute frontend development environment.

## Install

```bash
composer install
```

If replacing the previous minimal version, this package adds PSR-4 autoloading.
Run:

```bash
composer dump-autoload
```

Point Apache's document root to `public/`.

## Routes

```text
/                     HomeController::index()
/layouts              LayoutController::index()
/layouts/{id}/edit    LayoutController::edit()
```

## Structure

```text
data/
    JSON fixtures

public/
    Apache document root
    front controller
    frontend assets

src/
    Controller/
        Controller.php
        HomeController.php
        LayoutController.php
    routes.php

templates/
    base.twig
    home.twig
    layouts/
        index.twig
        edit.twig
```

FastRoute only maps routes to controller methods. Controllers load fixture data and render Twig templates. There is deliberately no container, ORM, database, middleware framework, or frontend router.
