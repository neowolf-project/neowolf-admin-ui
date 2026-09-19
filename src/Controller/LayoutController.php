<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

use RuntimeException;

final class LayoutController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('layout/index.twig', [
            'layouts' => $this->fixture('layouts'),
        ]);
    }

    public function edit(array $vars): void
    {
        if (!isset($vars['id'])) {
            header('Location: /layout');
            exit;
        }

        $id = (int) $vars['id'];

        $layouts = $this->fixture('layout-edit');
        $layout = $layouts[$id] ?? null;

        if ($layout === null) {
            throw new RuntimeException(
                "Layout $id was not found."
            );
        }

        $this->render('layout/edit.twig', [
            'layout' => $layout,
            'content_types' => [
                'text/html',
                'text/plain',
                'application/json',
                'application/xml',
            ],
        ]);
    }
}