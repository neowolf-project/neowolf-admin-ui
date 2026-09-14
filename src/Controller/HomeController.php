<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class HomeController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('home.twig');
    }
}
