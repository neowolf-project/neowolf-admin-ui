# Neowolf Admin Backend Roadmap

## 1. Finish the standalone admin UI

Complete the remaining parts of the `neowolf-admin-ui` reference implementation.

### Add forms

Reuse the existing edit views for create actions rather than building separate form templates.

- [ ] Add Page form
- [ ] Add Layout form
- [ ] Add Snippet form
- [ ] Establish sensible defaults for new records
- [ ] Make the small create-vs-edit differences clear in the reused views

### Generic delete dialog

Use the existing generic dialog for destructive actions.

- [ ] Page deletion
- [ ] Layout deletion
- [ ] Snippet deletion
- [ ] Plugin-specific deletion of plugin-owned data

The generic dialog should remain responsible only for the confirmation UI. The caller remains responsible for the actual deletion operation.

### Indented tree feature detection and fallback

The indented page tree uses typed CSS `attr()` to read the numeric tree depth:

```css
@supports (x: attr(x type(*))) {
    .tree-node {
        --tree-depth: attr(data-depth type(<number>), 0);
    }

    .tree-page {
        padding-left: calc(
            0.25rem +
            var(--tree-indent-step) * var(--tree-depth)
        );
    }
}
```

- [ ] Use JavaScript to detect support for the CSS feature required by the indented tree.
- [ ] When supported, use the normal indented/nested tree presentation.
- [ ] When unsupported, keep the page tree fully usable but fall back to the non-indented presentation.
- [ ] Trigger the generic dialog with its attention/shake behaviour to explain that visual nesting/indentation is unavailable in the current browser.
- [ ] Do not auto-close this dialog; require the user to explicitly close/acknowledge it.
- [ ] Show this compatibility notice only once. After it has been closed, store an acknowledgement state (for example in `localStorage`) so it is not shown again on subsequent page loads.
- [ ] Use a specific/versioned storage key so the acknowledgement can be reset later if the compatibility requirement or message changes.
- [ ] Do not describe the tree itself as unsupported; only the indented nested-tree presentation is unavailable.
- [ ] Ensure the fallback does not remove normal page-tree operations or keyboard accessibility.

This is progressive enhancement: lack of typed `attr()` support should affect the visual representation of hierarchy, not the functionality of the page tree.

### Final admin-ui pass

- [ ] Final accessibility review
- [ ] Final responsive/layout review
- [ ] Final consistency review
- [ ] Remove or identify demo-only behaviour that will not move into Neowolf

The standalone admin UI should remain the reference implementation for the new backend.

---

## 2. Move the new UI into Neowolf CMS

Replace the current backend with the new admin UI.

### Integration

- [ ] Connect the new UI to the real Neowolf controllers
- [ ] Connect real models/data
- [ ] Replace fixture data with real CMS data
- [ ] Replace demo/localStorage persistence with real backend operations
- [ ] Connect real CSRF protection
- [ ] Connect real page/layout/snippet CRUD operations
- [ ] Connect plugin-specific backend functionality

### Adapt the data boundary

The UI does not need to force the existing Neowolf data structures into the shape of the demo.

Where necessary:

- [ ] Map real Neowolf data to the data expected by views
- [ ] Introduce view models/presenters where they make the boundary cleaner
- [ ] Tweak the UI where the real CMS data or workflow makes a different representation more appropriate

The goal is to make the real CMS work with the new UI without unnecessary duplication or complexity.

---

## 3. Introduce a proper i18n API

Do this after the new backend is working against real Neowolf data.

The current base64-encoded i18n data attributes are a temporary transport mechanism and should be replaced.

### One source, multiple outputs

Use a single translation source with multiple consumers:

```text
                    Translation source
                           |
             +-------------+-------------+
             |             |             |
            PHP           JSON          other
             |             |
        I18n::get()    JavaScript i18n
```

### PHP

- [ ] Define the core PHP i18n API
- [ ] Locale handling
- [ ] Add `I18n::direction($locale)` in core, returning `ltr` or `rtl`
- [ ] Use the locale direction for the backend document `dir` attribute
- [ ] Keep `ltr` as the safe default for unknown/unsupported locales
- [ ] English fallback
- [ ] Plugin translation namespaces

### JavaScript

- [ ] Define the JavaScript i18n API
- [ ] Provide translations through a JSON/API endpoint
- [ ] Cache/load translations appropriately
- [ ] English fallback
- [ ] Plugin translation namespaces

### Remove the temporary mechanism

- [ ] Remove base64 i18n data attributes
- [ ] Remove duplicated translation data from views
- [ ] Move existing JS strings to the common i18n system

The intended model is **one translation source → multiple outputs/consumers**.

---

## 4. Modernize the controller/view boundary

Once the UI and i18n systems are working, review the existing legacy controller/view code.

The objective is **evolution, not a big-bang rewrite**.

### View responsibility

Treat PHP views by the same principle as any template:

> A view may contain presentation logic, but it should not contain application logic or data retrieval.

Views should primarily:

- render HTML;
- loop over prepared data;
- make small presentation decisions;
- choose presentation classes/markup;
- display already-prepared values.

Data retrieval, application logic, transformations, permissions, hierarchy calculations, URL generation, and similar work should move out of views where appropriate.

This is especially relevant to areas such as `page/children`.

### Controllers and view data

- [ ] Review what controllers currently pass to views
- [ ] Remove unnecessary work from views
- [ ] Reduce unnecessary calls from views
- [ ] Prepare view data before rendering
- [ ] Introduce ViewModels where they provide a useful, explicit data contract
- [ ] Improve typing where it provides real value
- [ ] Keep legacy APIs working while new methods are introduced

Do not modernize code merely because it is old. Prefer incremental improvements where existing code is already being touched or where the separation of responsibilities provides a clear benefit.

---

## Guiding principles

### Keep Neowolf simple

Neowolf should remain simple at heart. New capabilities should not automatically become requirements.

### Modernize incrementally

Introduce modern methods and structures while supporting the existing API for the time being.

### One source, multiple consumers

Where the same information is needed by PHP, JavaScript, or other outputs, prefer a single source with appropriate representations rather than duplicated systems.

### Keep responsibilities clear

- **Controllers/services:** obtain and prepare data.
- **ViewModels/presenters:** define and prepare view-facing data where useful.
- **Views:** render and handle presentation logic.
- **JavaScript:** handle client-side interaction.
- **Generic UI components:** provide reusable behaviour without knowing application-specific business rules.
- **Plugins:** own their plugin-specific application logic and data.

### No forced migration

Existing functionality should continue working while newer approaches are introduced. Old APIs can be removed later when they are genuinely obsolete and no longer needed.

### PHP remains the template language

Neowolf's built-in `View` class and PHP views remain the standard rendering system used by core. Alternative template engines such as Twig or Smarty are outside the scope of the current project and can be reconsidered later if there is a demonstrated need.

---

## Current position

The standalone admin UI is substantially complete and serves as the reference implementation.

The next immediate task is:

**Finish Add Page / Layout / Snippet forms, then continue with the remaining admin-ui work before beginning the CMS integration.**
