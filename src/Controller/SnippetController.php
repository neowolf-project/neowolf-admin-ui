<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class SnippetController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('snippet/index.twig', [
            'snippets' => $this->fixture('snippets'),
        ]);
    }

    public function add(array $vars = []): void
    {
        $snippet = [
            'id' => null,
            'name' => '',
            'filter_id' => 'kubes_markdown',
            'body' => '',
        ];

        $this->renderForm(
            snippet: $snippet,
            mode: 'add',
            formAction: '/snippet/add',
        );
    }

    public function edit(array $vars = []): void
    {
        $id = (int) ($vars['id'] ?? 0);

        if ($id < 1) {
            header('Location: /snippet');
            exit;
        }

        $snippets = $this->fixture('snippet-edit');
        $snippet = $snippets[$id] ?? null;

        if ($snippet === null) {
            http_response_code(404);
            $this->render('404.twig');
            return;
        }

        $this->renderForm(
            snippet: $snippet,
            mode: 'edit',
            formAction: '/snippet/edit/' . $id,
        );
    }

    private function renderForm(
        array $snippet,
        string $mode,
        string $formAction
    ): void {
        $this->render('snippet/form.twig', [
            'snippet' => $snippet,
            'mode' => $mode,
            'form_action' => $formAction,
            'filters' => $this->fixture('filters'),
        ]);
    }
}