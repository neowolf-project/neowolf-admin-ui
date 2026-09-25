<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

use RuntimeException;

final class SnippetController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('snippet/index.twig', [
            'snippets' => $this->fixture('snippets'),
        ]);
    }

    public function edit(array $vars): void
    {
        if (!isset($vars['id'])) {
            header('Location: /snippet');
            exit;
        }

        $id = (int) $vars['id'];

        $snippets = $this->fixture('snippet-edit');
        $snippet = $snippets[$id] ?? null;

        if ($snippet === null) {
            throw new RuntimeException(
                "Snippet $id was not found."
            );
        }

        $this->render('snippet/form.twig', [
            'snippet' => $snippet,
            'filters' => $this->fixture('filters'),
        ]);
    }
}