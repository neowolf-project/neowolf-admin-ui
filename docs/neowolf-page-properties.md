# Neowolf Page Properties

Neowolf keeps useful page behaviour in the core where it can be
expressed as a small, well-defined page property. These properties are
available out of the box and do not require plugins.

The goal is to keep each property clear and independent. A property
should describe one capability or state and should not silently acquire
unrelated meanings.

## Properties

  -----------------------------------------------------------------------
  Property                            Meaning
  ----------------------------------- -----------------------------------
  `protected`                         The page itself cannot be modified
                                      through normal page-management
                                      actions. Viewing the page and
                                      adding children remain allowed.

  `movable`                           Determines whether the page's own
                                      position in the page tree may be
                                      changed.

  `viewable`                          Determines whether the frontend
                                      page can currently be viewed from
                                      the admin.

  `deletable`                         Determines whether the page may be
                                      deleted.

  `expanded`                          The current or initial presentation
                                      state of the page in the tree. This
                                      is not a permission.
  -----------------------------------------------------------------------

## `movable`

`movable` is a property of the Page/PageModel.

``` php
$page->movable;
```

When `movable` is `false`, the page must keep both:

-   its current parent;
-   its current sibling position.

For example:

``` text
1. Page A
2. Page B  <- movable: false
3. Page C
4. Page D
```

Page B cannot be moved. Other pages also cannot be moved in a way that
changes Page B's position.

This does **not** lock the contents of Page B. Pages may still be added
or moved underneath it, and its children may be reordered normally.

In short:

> `movable` controls the position of the page itself, not the pages
> below it.

## `protected`

A protected page may still be used as part of the page hierarchy.

When `protected` is `true`:

-   the page can be expanded and collapsed;
-   the page can be viewed when it is viewable;
-   child pages can be added;
-   existing pages may be moved underneath it when otherwise permitted;
-   the page itself cannot be edited;
-   its layout cannot be changed;
-   its status cannot be changed;
-   it cannot be copied;
-   it cannot be deleted;
-   it cannot be moved.

Protected pages therefore use `movable: false`, while `movable: false`
by itself does **not** imply that a page is protected.

## Separation of responsibilities

The implementation remains small even though the resulting UI behaviour
is comprehensive.

**PHP / PageModel** provides the page properties.

**Twig** exposes the relevant state and renders controls appropriately.

**Page-tree JavaScript** implements the interaction rules consistently
for pointer and keyboard operation.

**The backend reorder action** validates that a page with
`movable: false` has retained the same parent and sibling position.

This keeps the semantic rule in the model while allowing the UI to
provide the richer behaviour needed to enforce it clearly and
accessibly.

## Core philosophy

Small capabilities can make a significant difference when they work
consistently throughout the CMS.

Neowolf therefore provides useful general-purpose page behaviour in the
core when it can be represented by a simple, well-defined concept.
Specialized behaviour remains the responsibility of plugins.

> Common building blocks belong in the core. Specialized behaviour
> belongs in plugins.

A site that never needs a particular property does not need to configure
or think about it. A site that does need it can use it immediately
without installing a plugin or adding custom JavaScript.
