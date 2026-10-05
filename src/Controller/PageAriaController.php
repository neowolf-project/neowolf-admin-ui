<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class PageAriaController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('page/tree-aria-demo.twig');
    }
}