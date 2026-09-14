'use strict';

window.Neowolf = window.Neowolf || {};

(() => {
    const Neowolf = window.Neowolf;
    const pageTree = document.getElementById('page-tree');

    if (!(pageTree instanceof HTMLElement)) {
        return;
    }

    const treeRoot = pageTree.querySelector('.tree-root');

    if (!(treeRoot instanceof HTMLElement)) {
        return;
    }

    const homeNode = treeRoot.querySelector(':scope > .tree-node');

    if (!(homeNode instanceof HTMLElement)) {
        return;
    }

    const homeChildren = getDirectChildList(homeNode);

    if (!(homeChildren instanceof HTMLElement)) {
        return;
    }

    const statusRegion =
        document.getElementById('tree-demo-message')
        ?? pageTree.querySelector('[data-page-tree-status]')
        ?? Neowolf.tree?.getStatusRegion(pageTree);

    const layoutDialog = document.getElementById('layout-page-dialog');
    const layoutPageForm = document.getElementById('layout-page-form');
    const pageLayoutField = document.getElementById('page-layout-field');
    const cancelLayoutButton = document.getElementById('cancel-layout-page-button');
    const confirmLayoutButton = document.getElementById('confirm-layout-page-button');
    const statusDialog = document.getElementById('status-page-dialog');
    const statusPageForm = document.getElementById('status-page-form');
    const pageStatusField = document.getElementById('page-status-field');
    const cancelStatusButton = document.getElementById('cancel-status-page-button');
    const confirmStatusButton = document.getElementById('confirm-status-page-button');
    const viewDialog = document.getElementById('view-page-dialog');
    const viewPageUrl = document.getElementById('view-page-url');
    const closeViewButton = document.getElementById('close-view-page-button');
    const addDialog = document.getElementById('add-page-dialog');
    const addPageForm = document.getElementById('add-page-form');
    const pageTitleField = document.getElementById('page-title-field');
    const cancelAddButton = document.getElementById('cancel-add-page-button');
    const confirmAddButton = document.getElementById('confirm-add-page-button');
    const deleteDialog = document.getElementById('delete-page-dialog');
    const deletePageMessage = document.getElementById('delete-page-message');
    const cancelDeleteButton = document.getElementById('cancel-delete-page-button');
    const confirmDeleteButton = document.getElementById('confirm-delete-page-button');

    function getFrontendOrigin() {
        const origin = pageTree.dataset.frontendOrigin?.trim();

        if (!origin || origin === 'null') {
            return '';
        }

        return origin.replace(/\/+$/, '');
    }
    const userLoggedIn =
        pageTree.dataset.userLoggedIn !== 'false';
    const editUrlTemplate =
        pageTree.dataset.editUrlTemplate
        ?? '/admin/page/edit/{id}';
    const addUrlTemplate =
        pageTree.dataset.addUrlTemplate
        ?? '/admin/page/add/{id}';

    const templateSource = pageTree.querySelector(
        '.tree-node[data-page-id]:not([data-page-id="1"])'
    );

    const nodeTemplate = templateSource?.cloneNode(true) ?? null;

    if (nodeTemplate) {
        getDirectChildList(nodeTemplate)?.replaceChildren();
    }

    const collapsedPageIds = new Set();

    pageTree.querySelectorAll('.tree-node').forEach((node) => {
        const childList = getDirectChildList(node);
        if (childList?.hidden) {
            collapsedPageIds.add(Number(node.dataset.pageId));
        }
    });

    let nestedSorter = null;
    let pendingAddParentNode = null;
    let pendingLayoutNode = null;
    let pendingLayoutButton = null;
    let pendingStatusNode = null;
    let pendingStatusButton = null;
    let pendingDeleteNode = null;

    function announce(message) {
        if (Neowolf.tree?.announce) {
            Neowolf.tree.announce(statusRegion, message);
            return;
        }

        if (statusRegion) {
            statusRegion.textContent = message;
        }
    }

    function emit(name, detail = {}) {
        pageTree.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            detail,
        }));
    }

    function buildUrl(template, id) {
        return template.replace('{id}', encodeURIComponent(String(id)));
    }

    function setToggleState(toggle, expanded, title) {
        const action = expanded ? 'Collapse' : 'Expand';

        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', `${action} ${title}`);
        toggle.dataset.tooltip = `${action} ${title}`;
    }

    function setNodeCollapsed(node, collapsed, {notify = true} = {}) {
        if (!(node instanceof HTMLElement)) {
            return;
        }

        const pageId = Number(node.dataset.pageId);
        const childList = getDirectChildList(node);
        const toggle = node.querySelector(':scope > .tree-row .tree-toggle');

        if (!childList || !toggle || !Number.isInteger(pageId)) {
            return;
        }

        if (collapsed) {
            collapsedPageIds.add(pageId);
        } else {
            collapsedPageIds.delete(pageId);
        }

        childList.hidden = collapsed;
        setToggleState(toggle, !collapsed, getNodeTitle(node));

        if (notify) {
            emit('neowolf:page-tree-collapse', {
                pageId,
                collapsed,
                collapsedPageIds: [...collapsedPageIds],
            });
        }
    }

    function applyCollapsedState() {
        pageTree.querySelectorAll('.tree-node').forEach((node) => {
            const pageId = Number(node.dataset.pageId);
            const childList = getDirectChildList(node);
            const toggle = node.querySelector(':scope > .tree-row .tree-toggle');

            if (!childList || !toggle || !Number.isInteger(pageId)) {
                return;
            }

            const collapsed = collapsedPageIds.has(pageId);
            childList.hidden = collapsed;
            setToggleState(toggle, !collapsed, getNodeTitle(node));
        });

        document.getElementById('tree-collapse-bootstrap')?.remove();
    }

    function getCollapsedPageIds() {
        return [...collapsedPageIds];
    }

    function setCollapsedPageIds(pageIds) {
        collapsedPageIds.clear();

        for (const pageId of pageIds ?? []) {
            const id = Number(pageId);
            if (Number.isInteger(id)) {
                collapsedPageIds.add(id);
            }
        }

        applyCollapsedState();
    }

    function getPageIconName(link) {
        const requestedIcon =
            link.dataset.pageIcon?.trim() || 'page';

        return document.getElementById(
            `icon-${requestedIcon}`
        )
            ? requestedIcon
            : 'page';
    }

    function syncPageIcon(link) {
        const iconName = getPageIconName(link);

        let icon = link.querySelector(
            ':scope > .page-icon'
        );

        if (!icon) {
            icon = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );

            icon.classList.add('page-icon');
            icon.setAttribute('aria-hidden', 'true');

            const use = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'use'
            );

            icon.append(use);
            link.prepend(icon);
        }

        icon
            .querySelector('use')
            .setAttribute(
                'href',
                `#icon-${iconName}`
            );
    }

    function syncAllPageIcons() {
        pageTree
            .querySelectorAll('.tree-title')
            .forEach(syncPageIcon);
    }

    function getNodeTitle(node) {
        return node
            .querySelector(':scope > .tree-row .tree-title')
            .textContent
            .trim();
    }

    function getDirectChildList(node) {
        return [...node.children].find(
            (child) => child.classList.contains('tree-children')
        ) ?? null;
    }

    function getSiblingPosition(node) {
        return [...node.parentElement.children]
            .filter((child) => child.classList.contains('tree-node'))
            .indexOf(node) + 1;
    }

    function getHighestPageId() {
        return Math.max(
            0,
            ...[...pageTree.querySelectorAll('.tree-node')]
                .map((node) => Number(node.dataset.pageId))
                .filter(Number.isInteger)
        );
    }

    function getDirectNodes(list) {
        return [...list.children].filter((node) =>
            node.classList.contains('tree-node')
        );
    }

    function syncTreeDepths(list = treeRoot, depth = 0) {
        getDirectNodes(list).forEach((node) => {
            node.dataset.depth = String(depth);

            const childList = getDirectChildList(node);

            if (childList) {
                syncTreeDepths(childList, depth + 1);
            }
        });
    }

    function isSlugUniqueAtLevel(slug, list, excludeNode = null) {
        return !getDirectNodes(list).some((node) => (
            node !== excludeNode
            && (node.dataset.slug ?? '') === slug
        ));
    }

    function getUniqueSlug(baseSlug, list, excludeNode = null) {
        if (isSlugUniqueAtLevel(baseSlug, list, excludeNode)) {
            return baseSlug;
        }

        let suffix = 2;

        while (!isSlugUniqueAtLevel(
            `${baseSlug}-${suffix}`,
            list,
            excludeNode
        )) {
            suffix += 1;
        }

        return `${baseSlug}-${suffix}`;
    }

    function syncLayoutButton(node) {
        const layoutButton = node.querySelector(
            ':scope > .tree-row .layout-button'
        );

        if (!layoutButton) {
            return;
        }

        const title = getNodeTitle(node);
        const layout = layoutButton.textContent.trim();

        layoutButton.setAttribute(
            'aria-label',
            `Change layout for ${title}. Current layout: ${layout}`
        );
        layoutButton.dataset.tooltip = 'Change layout';
    }

    function syncAllLayoutButtons() {
        pageTree
            .querySelectorAll('.tree-node')
            .forEach(syncLayoutButton);
    }

    function syncStatusButton(node) {
        const statusButton = node.querySelector(
            ':scope > .tree-row .status-badge'
        );

        if (!statusButton) {
            return;
        }

        const title = getNodeTitle(node);
        const status = statusButton.textContent.trim();

        statusButton.setAttribute(
            'aria-label',
            `Change status for ${title}. Current status: ${status}`
        );
        statusButton.dataset.tooltip = 'Change status';
    }

    function syncAllStatusButtons() {
        pageTree
            .querySelectorAll('.tree-node')
            .forEach(syncStatusButton);
    }

    function canViewPage(status) {
        return (
            status === 'Published'
            || status === 'Hidden'
            || (status === 'Preview' && userLoggedIn)
        );
    }

    function getFrontendPath(node) {
        if (node === homeNode) {
            return '/';
        }

        const segments = [];
        let current = node;

        while (current && current !== homeNode) {
            if (current.dataset.slug) {
                segments.unshift(current.dataset.slug);
            }

            current = current.parentElement?.closest('.tree-node') ?? null;
        }

        return `/${segments.join('/')}`;
    }

    function syncNodeUrls(node) {
        const pageId = Number(node.dataset.pageId);
        const title = node.querySelector(':scope > .tree-row .tree-title');
        const viewAction = node.querySelector(
            ':scope > .tree-row .view-page-button'
        );
        const addAction = node.querySelector(
            ':scope > .tree-row .add-page-button'
        );

        if (title) {
            title.href = buildUrl(editUrlTemplate, pageId);
        }

        if (viewAction) {
            const status = node.querySelector(
                ':scope > .tree-row .status-badge'
            )?.textContent.trim();

            viewAction.dataset.pageUrl =
                getFrontendOrigin() + getFrontendPath(node);
            viewAction.disabled = !canViewPage(status);
        }

        if (addAction) {
            addAction.href = buildUrl(addUrlTemplate, pageId);
        }
    }

    function syncAllNodeUrls() {
        pageTree.querySelectorAll('.tree-node').forEach(syncNodeUrls);
    }

    function hasUniqueSlugsPerLevel(nodes) {
        const slugs = new Set();

        for (const node of nodes) {
            if (slugs.has(node.slug)) {
                return false;
            }

            slugs.add(node.slug);

            if (!hasUniqueSlugsPerLevel(node.children ?? [])) {
                return false;
            }
        }

        return true;
    }

    function getNextCopyNumber(sourceNode) {
        const sourceTitle = getNodeTitle(sourceNode);
        const sourceSlug =
            sourceNode.dataset.slug
            || slugify(sourceTitle)
            || 'page';

        const escapedSlug = sourceSlug.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );
        const copyPattern = new RegExp(
            `^${escapedSlug}-copy-(\\d+)$`
        );

        let highest = 0;

        pageTree.querySelectorAll('.tree-node').forEach((node) => {
            const slug = node.dataset.slug ?? '';
            const match = slug.match(copyPattern);

            if (match) {
                highest = Math.max(
                    highest,
                    Number(match[1])
                );
            }
        });

        return highest + 1;
    }

    function slugify(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function ensureChildList(node) {
        let list = getDirectChildList(node);

        if (list) {
            return list;
        }

        list = document.createElement('ul');
        list.className = 'tree-children';
        list.id = `children-${node.dataset.pageId}`;

        node.append(list);

        return list;
    }

    function ensureAllChildLists() {
        pageTree.querySelectorAll('.tree-node').forEach((node) => {
            ensureChildList(node);
        });

        syncDropLabels();
    }

    function syncDropLabels() {
        pageTree.querySelectorAll('.tree-node').forEach((node) => {
            const list = getDirectChildList(node);

            if (list) {
                list.dataset.dropLabel =
                    `Drop inside ${getNodeTitle(node)}`;
            }
        });
    }

    function isReorderMode() {
        return nestedSorter?.isEnabled() ?? false;
    }

    function ensureTreeToggle(node, list) {
        const page = node.querySelector(':scope > .tree-row > .tree-page');
        let toggle = page.querySelector(':scope > .tree-toggle');

        if (toggle) {
            toggle.setAttribute('aria-controls', list.id);
            toggle.disabled = isReorderMode();
            return;
        }

        const spacer = page.querySelector(':scope > .tree-spacer');

        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'tree-toggle';
        toggle.setAttribute('aria-controls', list.id);
        toggle.disabled = isReorderMode();

        const title = getNodeTitle(node);

        setToggleState(toggle, true, title);
        toggle.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6"></path>
            </svg>
        `;

        if (spacer) {
            spacer.replaceWith(toggle);
        } else {
            page.prepend(toggle);
        }
    }

    function syncToggle(node) {
        const list = getDirectChildList(node);
        const page = node.querySelector(':scope > .tree-row > .tree-page');

        if (!list || !page) {
            return;
        }

        const hasChildren = Boolean(
            list.querySelector(':scope > .tree-node')
        );

        const toggle = page.querySelector(':scope > .tree-toggle');
        const spacer = page.querySelector(':scope > .tree-spacer');

        if (hasChildren) {
            ensureTreeToggle(node, list);
            return;
        }

        if (node === homeNode) {
            return;
        }

        if (toggle) {
            const replacement = document.createElement('span');
            replacement.className = 'tree-spacer';
            replacement.setAttribute('aria-hidden', 'true');

            toggle.replaceWith(replacement);
        } else if (!spacer) {
            const replacement = document.createElement('span');
            replacement.className = 'tree-spacer';
            replacement.setAttribute('aria-hidden', 'true');

            page.prepend(replacement);
        }
    }

    function syncAllToggles() {
        pageTree
            .querySelectorAll('.tree-node')
            .forEach(syncToggle);
    }

    function syncMoveHandle(node) {
        const handle = node.querySelector(
            ':scope > .tree-row .drag-handle'
        );

        if (!handle) {
            return;
        }

        const title = getNodeTitle(node);

        handle.setAttribute(
            'aria-label',
            `Move ${title}. Press Space to select for moving.`
        );
        handle.dataset.tooltip = `Move ${title}`;
    }

    function syncAllMoveHandles() {
        pageTree
            .querySelectorAll('.tree-node')
            .forEach(syncMoveHandle);
    }

    function syncTreeStructure({refreshSortable = true} = {}) {
        ensureAllChildLists();
        syncTreeDepths();
        syncAllToggles();
        syncAllPageIcons();
        syncAllLayoutButtons();
        syncAllStatusButtons();
        syncAllMoveHandles();
        syncAllNodeUrls();

        if (refreshSortable) {
            nestedSorter?.refresh();
        }
    }
    function updateNodePresentation(node, data) {
        node.dataset.pageId = String(data.page_id);
        node.dataset.slug = data.slug;

        const title = node.querySelector(
            ':scope > .tree-row .tree-title'
        );

        title.textContent = data.title;
        title.href = buildUrl(editUrlTemplate, data.page_id);

        if (data.icon && data.icon !== 'page') {
            title.dataset.pageIcon = data.icon;
        } else {
            delete title.dataset.pageIcon;
        }

        syncPageIcon(title);

        const layoutButton = node.querySelector(
            ':scope > .tree-row .layout-button'
        );

        if (layoutButton) {
            layoutButton.textContent = data.layout;
        }

        syncLayoutButton(node);

        const status = node.querySelector(
            ':scope > .tree-row .status-badge'
        );

        if (status) {
            status.textContent = data.status;
        }

        syncStatusButton(node);

        const viewAction = node.querySelector(
            ':scope > .tree-row .view-page-button'
        );

        if (viewAction) {
            viewAction.dataset.pageUrl =
                getFrontendOrigin() + getFrontendPath(node);
            viewAction.disabled = !canViewPage(data.status);
            viewAction.setAttribute(
                'aria-label',
                `View ${data.title}`
            );
        }

        const addAction = node.querySelector(
            ':scope > .tree-row .add-page-button'
        );

        if (addAction) {
            addAction.setAttribute(
                'aria-label',
                `Add page to ${data.title}`
            );
        }

        const copyButton = node.querySelector(
            ':scope > .tree-row .copy-button'
        );

        if (copyButton) {
            copyButton.setAttribute(
                'aria-label',
                `Copy ${data.title}`
            );
        }

        syncMoveHandle(node);

        const deleteButton = node.querySelector(
            ':scope > .tree-row .delete-button'
        );

        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.setAttribute(
                'aria-label',
                `Delete ${data.title}`
            );
            deleteButton.dataset.tooltip = 'Delete page';
        }

        const childList = ensureChildList(node);
        childList.id = `children-${data.page_id}`;

        const toggle = node.querySelector(
            ':scope > .tree-row .tree-toggle'
        );

        if (toggle) {
            toggle.setAttribute(
                'aria-controls',
                childList.id
            );
        }
    }

    function createNode(data) {
        const node = nodeTemplate.cloneNode(true);
        const childList = getDirectChildList(node);

        if (childList) {
            childList.replaceChildren();
        }

        updateNodePresentation(node, data);

        return node;
    }

    function serialize() {
        return serializeTree(homeChildren);
    }

    function restore(tree, {notify = false, reason = 'restore'} = {}) {
        if (!isValidStoredTree(tree)) {
            return false;
        }

        restoreTree(tree);
        applyCollapsedState();

        if (notify) {
            notifyTreeChange(reason);
        }

        return true;
    }

    function notifyTreeChange(reason, detail = {}) {
        const tree = serialize();

        emit('neowolf:page-tree-change', {
            reason,
            tree,
            ...detail,
        });

        return tree;
    }

    function serializeTree(list) {
        return [...list.children]
            .filter((node) => node.classList.contains('tree-node'))
            .map((node, index) => {
                const childList = getDirectChildList(node);

                return {
                    page_id: Number(node.dataset.pageId),
                    slug: node.dataset.slug,
                    title: getNodeTitle(node),
                    icon: getPageIconName(
                        node.querySelector(':scope > .tree-row .tree-title')
                    ),
                    layout: node.querySelector(
                        ':scope > .tree-row .tree-layout'
                    )?.textContent.trim() ?? '',
                    status: node.querySelector(
                        ':scope > .tree-row .status-badge'
                    )?.textContent.trim() ?? '',
                    position: index + 1,
                    children: childList
                        ? serializeTree(childList)
                        : []
                };
            });
    }

    function isValidStoredTree(nodes) {
        if (!Array.isArray(nodes)) {
            return false;
        }

        if (!hasUniqueSlugsPerLevel(nodes)) {
            return false;
        }

        return nodes.every((node) => {
            return (
                Number.isInteger(node.page_id)
                && typeof node.slug === 'string'
                && typeof node.title === 'string'
                && (
                    node.icon === undefined
                    || typeof node.icon === 'string'
                )
                && Number.isInteger(node.position)
                && Array.isArray(node.children)
                && isValidStoredTree(node.children)
            );
        });
    }

    function restoreTree(tree) {
        const existingNodes = new Map(
            [...pageTree.querySelectorAll('.tree-node')]
                .filter((node) => node !== homeNode)
                .map((node) => [
                    Number(node.dataset.pageId),
                    node
                ])
        );

        existingNodes.forEach((node) => node.remove());

        function placeChildren(parentNode, children) {
            const list = ensureChildList(parentNode);

            list.replaceChildren();

            for (const item of children) {
                let node = existingNodes.get(item.page_id);

                if (!node) {
                    node = createNode(item);
                } else {
                    updateNodePresentation(node, item);
                }

                list.append(node);

                placeChildren(
                    node,
                    item.children ?? []
                );
            }
        }

        placeChildren(homeNode, tree);

        syncTreeStructure();
    }

    function copySubtree(sourceNode) {
        let nextPageId = getHighestPageId() + 1;
        const copyNumber = getNextCopyNumber(sourceNode);
        const rootDestination = sourceNode === homeNode
            ? homeChildren
            : sourceNode.parentElement;

        function copyNode(source, destinationList) {
            const sourceTitle = getNodeTitle(source);
            const sourceSlug =
                source.dataset.slug
                || slugify(sourceTitle)
                || 'page';

            const pageId = nextPageId++;
            const requestedSlug = `${sourceSlug}-copy-${copyNumber}`;
            const uniqueSlug = getUniqueSlug(
                requestedSlug,
                destinationList
            );

            const data = {
                page_id: pageId,
                slug: uniqueSlug,
                title: `${sourceTitle} copy ${copyNumber}`,
                icon: getPageIconName(
                    source.querySelector(
                        ':scope > .tree-row .tree-title'
                    )
                ),
                layout: source.querySelector(
                    ':scope > .tree-row .tree-layout'
                )?.textContent.trim() ?? '',
                status: source.querySelector(
                    ':scope > .tree-row .status-badge'
                )?.textContent.trim() ?? '',
                children: []
            };

            const copiedNode = createNode(data);
            const copiedChildren = ensureChildList(copiedNode);
            const sourceChildren = getDirectChildList(source);

            if (sourceChildren) {
                getDirectNodes(sourceChildren).forEach((child) => {
                    copiedChildren.append(
                        copyNode(child, copiedChildren)
                    );
                });
            }

            return copiedNode;
        }

        const copy = copyNode(sourceNode, rootDestination);

        if (sourceNode === homeNode) {
            homeChildren.prepend(copy);
        } else {
            sourceNode.after(copy);
        }

        syncTreeStructure();
        notifyTreeChange('copy', {node: copy});

        return copy;
    }

    function getDescendantCount(node) {
        return node.querySelectorAll('.tree-node').length;
    }

    function wireDialogButton(button, callback) {
        button?.addEventListener('click', callback);
    }

    pageTree.addEventListener('click', (event) => {
        const moveHandle = event.target.closest('.drag-handle');

        if (moveHandle) {
            event.preventDefault();
            return;
        }

        const layoutButton = event.target.closest('.layout-button');

        if (layoutButton) {
            const node = layoutButton.closest('.tree-node');

            if (!node) {
                return;
            }

            pendingLayoutNode = node;
            pendingLayoutButton = layoutButton;
            pageLayoutField.value = layoutButton.textContent.trim();

            layoutDialog.showModal();
            pageLayoutField.focus();
            return;
        }

        const statusButton = event.target.closest('.status-badge');

        if (statusButton) {
            const node = statusButton.closest('.tree-node');

            if (!node) {
                return;
            }

            pendingStatusNode = node;
            pendingStatusButton = statusButton;
            pageStatusField.value = statusButton.textContent.trim();

            statusDialog.showModal();
            pageStatusField.focus();
            return;
        }

        const viewButton = event.target.closest('.view-page-button');

        if (viewButton) {
            const pageUrl = viewButton.dataset.pageUrl;

            if (pageUrl) {
                viewPageUrl.textContent = pageUrl;
                viewDialog.showModal();
            }

            return;
        }

        const addButton = event.target.closest('.add-page-button');

        if (addButton) {
            const parentNode = addButton.closest('.tree-node');

            if (!parentNode) {
                return;
            }

            pendingAddParentNode = parentNode;
            addPageForm.reset();
            addDialog.showModal();
            pageTitleField.focus();
            return;
        }

        const copyButton = event.target.closest('.copy-button');

        if (copyButton) {
            const sourceNode = copyButton.closest('.tree-node');
            const copy = copySubtree(sourceNode);

            const copiedCount =
                copy.querySelectorAll('.tree-node').length + 1;

            announce(
                `Copied ${getNodeTitle(sourceNode)} and `
                + `${copiedCount - 1} child page`
                + `${copiedCount - 1 === 1 ? '' : 's'}.`);

            return;
        }

        const deleteButton = event.target.closest('.delete-button');

        if (deleteButton && !deleteButton.disabled) {
            const node = deleteButton.closest('.tree-node');

            if (!node || node === homeNode) {
                return;
            }

            const title = getNodeTitle(node);
            const descendantCount = getDescendantCount(node);

            pendingDeleteNode = node;
            deleteDialog.returnValue = '';
            deletePageMessage.textContent = descendantCount > 0
                ? `Delete “${title}” and its ${descendantCount} descendant page${descendantCount === 1 ? '' : 's'}? All child pages will also be deleted. This cannot be undone.`
                : `Delete “${title}”? This cannot be undone.`;

            deleteDialog.showModal();
            cancelDeleteButton.focus();
            return;
        }

        const toggle = event.target.closest('.tree-toggle');

        if (!toggle) {
            return;
        }

        /*
         * Branches do not expand or collapse while reorder mode is active.
         * Keep this behavioral guard even though tree-toggle buttons are also
         * disabled, because the tree structure can be refreshed after a move.
         */
        if (nestedSorter?.isEnabled()) {
            event.preventDefault();
            return;
        }

        const children = document.getElementById(
            toggle.getAttribute('aria-controls')
        );

        if (!children) {
            return;
        }

        const expanded =
            toggle.getAttribute('aria-expanded') === 'true';

        const nextExpanded = !expanded;
        const node = toggle.closest('.tree-node');

        setNodeCollapsed(node, !nextExpanded);
    });

    cancelLayoutButton.addEventListener('click', () => {
        layoutDialog.close('cancel');
    });

    confirmLayoutButton.addEventListener('click', () => {
        layoutPageForm.requestSubmit();
    });

    layoutPageForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const node = pendingLayoutNode;
        const layoutButton = pendingLayoutButton;
        const nextLayout = pageLayoutField.value;

        if (!node || !layoutButton) {
            return;
        }

        const previousLayout = layoutButton.textContent.trim();

        layoutButton.textContent = nextLayout;
        syncLayoutButton(node);
        notifyTreeChange('layout', {node});

        layoutDialog.close('save');

        announce(
            `${getNodeTitle(node)} layout changed from `
            + `${previousLayout} to ${nextLayout}.`);
    });

    layoutDialog.addEventListener('close', () => {
        const layoutButton = pendingLayoutButton;

        pendingLayoutNode = null;
        pendingLayoutButton = null;

        layoutButton?.focus();
    });

    cancelStatusButton.addEventListener('click', () => {
        statusDialog.close('cancel');
    });

    confirmStatusButton.addEventListener('click', () => {
        statusPageForm.requestSubmit();
    });

    statusPageForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const node = pendingStatusNode;
        const statusButton = pendingStatusButton;
        const nextStatus = pageStatusField.value;

        if (!node || !statusButton) {
            return;
        }

        const previousStatus = statusButton.textContent.trim();

        statusButton.textContent = nextStatus;
        syncStatusButton(node);
        syncNodeUrls(node);
        notifyTreeChange('status', {node});

        statusDialog.close('save');

        announce(
            `${getNodeTitle(node)} status changed from `
            + `${previousStatus} to ${nextStatus}.`);
    });

    statusDialog.addEventListener('close', () => {
        const statusButton = pendingStatusButton;

        pendingStatusNode = null;
        pendingStatusButton = null;

        statusButton?.focus();
    });

    closeViewButton.addEventListener('click', () => {
        viewDialog.close('cancel');
    });

    cancelAddButton.addEventListener('click', () => {
        addDialog.close('cancel');
    });

    confirmAddButton.addEventListener('click', () => {
        addPageForm.requestSubmit();
    });

    addPageForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const parentNode = pendingAddParentNode;
        const title = pageTitleField.value.trim();

        if (!parentNode || !title) {
            return;
        }

        const destinationList = ensureChildList(parentNode);
        const baseSlug = slugify(title) || 'page';
        const slug = getUniqueSlug(baseSlug, destinationList);
        const pageId = getHighestPageId() + 1;
        const node = createNode({
            page_id: pageId,
            slug,
            title,
            icon: 'page',
            layout: 'Default',
            status: 'Draft',
            children: []
        });

        destinationList.append(node);
        syncTreeStructure();
        notifyTreeChange('add', {node, parentNode});

        // Reveal the new page if its parent was collapsed.
        setNodeCollapsed(parentNode, false);
        syncToggle(parentNode);

        pendingAddParentNode = null;
        addDialog.close('add');

        announce(
            `Added ${title} as a draft page inside ${getNodeTitle(parentNode)}.`);

        node.querySelector(':scope > .tree-row .tree-title')?.focus();
    });

    addDialog.addEventListener('close', () => {
        if (addDialog.returnValue !== 'add') {
            pendingAddParentNode = null;
        }
    });

    cancelDeleteButton.addEventListener('click', () => {
        deleteDialog.close('cancel');
    });

    confirmDeleteButton.addEventListener('click', () => {
        deleteDialog.close('delete');
    });

    deleteDialog.addEventListener('close', () => {
        const node = pendingDeleteNode;
        pendingDeleteNode = null;

        if (!node || deleteDialog.returnValue !== 'delete') {
            if (node) {
                announce(
                    `Delete cancelled. ${getNodeTitle(node)} was not deleted.`);
            }
            return;
        }

        const title = getNodeTitle(node);
        const descendantCount = getDescendantCount(node);
        const parentNode = node.parentElement?.closest('.tree-node');
        const nextNode = node.nextElementSibling?.classList.contains('tree-node')
            ? node.nextElementSibling
            : null;
        const previousNode = node.previousElementSibling?.classList.contains('tree-node')
            ? node.previousElementSibling
            : null;

        node.remove();
        syncTreeStructure();
        notifyTreeChange('delete', {node: null, title});

        const focusTarget = nextNode
            ?? previousNode
            ?? parentNode;

        focusTarget?.querySelector(':scope > .tree-row .tree-title')?.focus();

        announce(
            descendantCount > 0
                ? `${title} and ${descendantCount} descendant page${descendantCount === 1 ? '' : 's'} deleted.`
                : `${title} deleted.`
        );
    });

    function initialiseSorter() {
        if (!Neowolf.sortableNestedTree) {
            return null;
        }

        const sorter = Neowolf.sortableNestedTree.init(pageTree, {
            rootListSelector: '.tree-root',
            listSelector: '.tree-children',
            itemSelector: '.tree-node',
            handleSelector: '.drag-handle',
            labelSelector: ':scope > .tree-row .tree-title',
            statusRegion,

            getId(node) {
                return node.dataset.pageId ?? '';
            },

            getLabel(node) {
                return getNodeTitle(node);
            },

            canMove({item, list, parent}) {
                /*
                 * Home is the fixed root of the Page Tree. Pages may be moved
                 * anywhere below Home, but never into the structural root list
                 * beside or above Home.
                 */
                if (!parent) {
                    return false;
                }

                const slug = item.dataset.slug ?? '';
                return isSlugUniqueAtLevel(slug, list, item);
            },

            onModeChange({enabled}) {
                const toggle = Neowolf.tree?.getToggle(pageTree);

                if (toggle) {
                    toggle.textContent = enabled
                        ? 'Finish reordering'
                        : 'Reorder';
                }

                pageTree
                    .querySelectorAll('.tree-toggle')
                    .forEach((treeToggle) => {
                        treeToggle.disabled = enabled;
                    });

                if (!enabled) {
                    applyCollapsedState();
                }
            },
        });

        pageTree.addEventListener(
            'neowolf:sortable-nested-change',
            (event) => {
                syncTreeStructure();

                /*
                 * Do not restore the saved collapsed state after each move.
                 * Reorder mode is still active at this point, so changing
                 * branch visibility here makes a Space/Enter drop appear to
                 * expand or collapse a branch. The saved state is restored
                 * when reorder mode is disabled in onModeChange().
                 */
                if (!sorter.isEnabled()) {
                    applyCollapsedState();
                }

                notifyTreeChange('reorder', {
                    move: event.detail,
                });
            }
        );

        return sorter;
    }

    syncTreeStructure({refreshSortable: false});
    applyCollapsedState();
    nestedSorter = initialiseSorter();
    nestedSorter?.refresh();

    const api = {
        root: pageTree,
        serialize,
        restore,
        refresh: () => {
            syncTreeStructure();
            applyCollapsedState();
        },
        createNode,
        updateNodePresentation,
        getNodeTitle,
        getDirectChildList,
        getCollapsedPageIds,
        setCollapsedPageIds,
        setNodeCollapsed,
        notifyChange: notifyTreeChange,
        sorter: nestedSorter,
    };

    Neowolf.pageTree = api;
    emit('neowolf:page-tree-ready', {api});
})();
