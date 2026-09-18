<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class SettingController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('setting/index.twig', [
            'plugins' => $this->fixture('plugins'),
            'settings' => $this->fixture('settings'),
            'languages' => $this->fixture('languages'),
            'sections' => $this->fixture('sections'),
            'statuses' => $this->fixture('statuses'),
            'filters' => $this->fixture('filters'),
        ]);
    }
}