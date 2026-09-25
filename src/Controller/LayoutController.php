<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

use RuntimeException;

final class LayoutController extends Controller
{
    private const array CONTENT_TYPES = [
        'text/html',
        'text/plain',
        'application/json',
        'application/xml',
    ];

    public function index(array $vars = []): void
    {
        $this->render('layout/index.twig', [
            'layouts' => $this->fixture('layouts'),
        ]);
    }

    public function edit(array $vars = []): void
    {
        $id = (int) ($vars['id'] ?? 0);

        if ($id < 1) {
            header('Location: /layout');
            exit;
        }

        $layouts = $this->fixture('layout-edit');
        $layout = $layouts[$id] ?? null;

        if ($layout === null) {
            throw new RuntimeException(
                "Layout $id was not found."
            );
        }

        $this->render('layout/form.twig', [
            'layout' => $layout,
            'content_types' => self::CONTENT_TYPES,
        ]);
    }
}