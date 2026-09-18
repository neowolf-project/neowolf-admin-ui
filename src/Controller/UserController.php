<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class UserController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('user/index.twig', [
            'users' => $this->fixture('users'),
        ]);
    }

    public function add(array $vars = []): void
    {
        $this->render('user/form.twig', [
            'mode' => 'add',
            'user' => [
                'id' => null,
                'name' => '',
                'username' => '',
                'email' => '',
                'language' => '',
                'roles' => [],
            ],
            'roles' => $this->fixture('roles'),
            'languages' => $this->fixture('languages'),
            'csrf_token' => 'prototype-token',
        ]);
    }

    public function edit(array $vars = []): void
    {
        $users = $this->fixture('users');
        $userId = (int) ($vars['id'] ?? 0);
        $user = null;

        foreach ($users as $candidate) {
            if ((int) $candidate['id'] === $userId) {
                $user = $candidate;
                break;
            }
        }

        if ($user === null) {
            // Prototype 404 handling.
            return;
        }

        $this->render('user/form.twig', [
            'mode' => 'edit',
            'user' => $user,
            'roles' => $this->fixture('roles'),
            'languages' => $this->fixture('languages'),
            'csrf_token' => 'prototype-token',
        ]);
    }
}
