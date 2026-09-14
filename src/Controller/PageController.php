<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class PageController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('page/index.twig', [
            'pages' => $this->fixture('pages'),
        ]);
    }
}
