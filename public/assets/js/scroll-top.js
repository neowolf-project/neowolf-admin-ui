'use strict';

(() => {
    const {dom} = window.Neowolf;

    const scrollTopLink =
        document.querySelector('.scroll-top');

    const SCROLL_TOP_THRESHOLD = 300;

    if (!scrollTopLink) {
        return;
    }

    function updateVisibility() {
        dom.setHidden(
            scrollTopLink,
            window.scrollY < SCROLL_TOP_THRESHOLD
        );
    }

    updateVisibility();

    window.addEventListener(
        'scroll',
        updateVisibility,
        {passive: true}
    );
})();
