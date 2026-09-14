<?php

declare(strict_types=1);

namespace NeowolfAdmin\Controller;

use RuntimeException;
use Twig\Environment;

abstract class Controller
{
    public function __construct(
        protected readonly Environment $twig,
        protected readonly string $projectRoot,
    ) {
    }

    protected function fixture(string $name): array
    {
        $filename = $this->projectRoot . '/data/' . $name . '.json';
        $json = file_get_contents($filename);

        if ($json === false) {
            throw new RuntimeException(
                "Could not read fixture: {$name}"
            );
        }

        return json_decode(
            $json,
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    }

    protected function render(
        string $template,
        array $data = []
    ): void {
        echo $this->twig->render($template, $data);
    }
}
