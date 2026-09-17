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

    public function edit(array $vars = []): void
    {
        $pages = $this->fixture('page-edit');

        $id = (int) ($vars['id'] ?? 0);
        $page = $pages[(string) $id] ?? null;

        if ($page === null) {
            http_response_code(404);

            $this->render('404.twig');

            return;
        }

        $this->render('page/edit.twig', [
            'page' => $page,
            'filters' => $this->fixture('filters'),
            'statuses' => $this->fixture('statuses'),
        ]);
    }
}