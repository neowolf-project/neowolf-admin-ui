<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class AuthController extends Controller
{

    public function index(array $vars = []): void
    {
        header('Location: /auth/login');
        exit;
    }
    public function login(array $vars = []): void
    {
        $this->render('auth/login.twig');
    }

    public function forgot(array $vars = []): void
    {
        $this->render('auth/forgot.twig');
    }

    public function register(array $vars = []): void
    {
        $this->render('auth/register.twig');
    }
}