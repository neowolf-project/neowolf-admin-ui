'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const form = document.getElementById('page-edit-form');

    if (!(form instanceof HTMLFormElement) || form.dataset.mode !== 'add') {
        return;
    }

    const titleInput = document.getElementById('page-title');
    const slugInput = document.getElementById('page-slug');

    if (!(titleInput instanceof HTMLInputElement)
        || !(slugInput instanceof HTMLInputElement)
        || !Neowolf.string?.slugify) {
        return;
    }

    let slugManuallyEdited = slugInput.value !== '';

    titleInput.addEventListener('input', () => {
        if (!slugManuallyEdited) {
            slugInput.value = Neowolf.string.slugify(titleInput.value);
        }
    });

    slugInput.addEventListener('input', () => {
        slugManuallyEdited = slugInput.value !== '';
    });
})();
