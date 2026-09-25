<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

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

    public function add(array $vars = []): void
    {
        $layout = [
            'id' => null,
            'name' => '',
            'content_type' => 'text/html',
            'body' => '',
        ];

        $this->renderForm(
            layout: $layout,
            mode: 'add',
            formAction: '/layout/add',
        );
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
            http_response_code(404);

            $this->render('404.twig');

            return;
        }

        $this->renderForm(
            layout: $layout,
            mode: 'edit',
            formAction: '/layout/edit/' . $id,
        );
    }

    private function renderForm(
        array $layout,
        string $mode,
        string $formAction
    ): void {
        $this->render('layout/form.twig', [
            'layout' => $layout,
            'mode' => $mode,
            'form_action' => $formAction,
            'content_types' => self::CONTENT_TYPES,
        ]);
    }
}