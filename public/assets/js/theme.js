'use strict';

(() => {
    const {root, dom, interaction} = window.Neowolf;

    const THEME_STORAGE_KEY = 'neowolf-color-scheme';

    const themeToggle =
        document.getElementById('theme-toggle');

    const themeStatus =
        document.getElementById('theme-status');

    const darkSchemeQuery =
        window.matchMedia('(prefers-color-scheme: dark)');

    function getEffectiveTheme() {
        return root.getAttribute('data-theme')
            || (darkSchemeQuery.matches ? 'dark' : 'light');
    }

    function updateThemeToggle(theme) {
        if (!themeToggle) {
            return;
        }

        const isDark = theme === 'dark';

        const label = isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode';

        themeToggle.setAttribute(
            'aria-pressed',
            String(isDark)
        );

        themeToggle.setAttribute(
            'aria-label',
            label
        );

        themeToggle.setAttribute(
            'data-tooltip',
            label
        );

        themeToggle.setAttribute(
            'data-placement',
            'left'
        );

        dom.setHidden(
            themeToggle.querySelector('.theme-icon-light'),
            isDark
        );

        dom.setHidden(
            themeToggle.querySelector('.theme-icon-dark'),
            !isDark
        );
    }

    function syncThemeToggle() {
        updateThemeToggle(getEffectiveTheme());
    }

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        syncThemeToggle();

        if (themeStatus) {
            themeStatus.textContent =
                theme === 'dark'
                    ? 'Dark mode enabled.'
                    : 'Light mode enabled.';
        }
    }

    syncThemeToggle();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme =
                getEffectiveTheme() === 'dark'
                    ? 'light'
                    : 'dark';

            setTheme(nextTheme);
        });

        themeToggle.addEventListener('pointerup', () => {
            interaction.blurAfterPointerInteraction(
                themeToggle
            );
        });
    }

    /*
     * Follow operating-system theme changes only when
     * the user has not explicitly selected a theme.
     */

    darkSchemeQuery.addEventListener('change', () => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            syncThemeToggle();
        }
    });
})();
