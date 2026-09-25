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

    public function add(array $vars = []): void
    {
        $parentId = (int) ($vars['parent_id'] ?? 0);

        if ($parentId < 1) {
            http_response_code(404);

            $this->render('404.twig');

            return;
        }

        $page = [
            'id' => null,
            'parent_id' => $parentId,
            'title' => '',
            'slug' => '',
            'breadcrumb' => '',
            'keywords' => '',
            'description' => '',
            'labels' => '',
            'layout' => 'Default',
            'page_type' => 'page',
            'published_date' => '',
            'published_time' => '',
            'valid_until_date' => '',
            'valid_until_time' => '',
            'login' => 2,
            'protected' => false,
            'status' => 1,
            'parts' => [
                [
                    'id' => null,
                    'name' => 'body',
                    'filter_id' => 'kubes_markdown',
                    'content' => '',
                ],
            ],
        ];

        $this->renderForm(
            page: $page,
            mode: 'add',
            formAction: '/page/add/' . $parentId,
        );
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

        $this->renderForm(
            page: $page,
            mode: 'edit',
            formAction: '/page/edit/' . $id,
        );
    }

    private function renderForm(
        array $page,
        string $mode,
        string $formAction
    ): void {
        $this->render('page/form.twig', [
            'page' => $page,
            'mode' => $mode,
            'form_action' => $formAction,
            'filters' => $this->fixture('filters'),
            'statuses' => $this->fixture('statuses'),
        ]);
    }
}