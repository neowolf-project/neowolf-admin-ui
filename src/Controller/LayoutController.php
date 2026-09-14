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
        $id = (int) ($vars['id'] ?? 0);

        $layout = array_find(
            $this->fixture('layouts'),
            static fn (array $layout): bool => (int) $layout['id'] === $id
        );

        if ($layout === null) {
            throw new RuntimeException(
                "Layout {$id} was not found."
            );
        }

        $this->render('layout/edit.twig', [
            'layout' => $layout,
        ]);
    }
}
