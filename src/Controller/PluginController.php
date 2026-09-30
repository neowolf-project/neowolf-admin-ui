<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

final class PluginController extends Controller
{
    public function index(array $vars = []): void
    {
        $this->render('plugin/index.twig', [
            'plugin' => $this->examplePlugin(),
            'active_section' => 'example',
        ]);
    }

    public function documentation(array $vars = []): void
    {
        $this->render('plugin/documentation.twig', [
            'plugin' => $this->examplePlugin(),
            'active_section' => 'example',
        ]);
    }

    public function settings(array $vars = []): void
    {
        $this->render('plugin/settings.twig', [
            'plugin' => $this->examplePlugin(),
            'active_section' => 'example',
        ]);
    }

    private function examplePlugin(): array
    {
        foreach ($this->fixture('plugins') as $plugin) {
            if ($plugin['id'] === 'example') {
                return $plugin;
            }
        }

        throw new \RuntimeException('Example plugin fixture not found.');
    }
}