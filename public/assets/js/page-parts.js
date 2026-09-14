'use strict';

(() => {
    const {dialog, tabs} = window.Neowolf;

    const CONTENT_TEXTAREA_SELECTOR =
        '.page-parts textarea[name^="part["][name$="[content]"]';

    const REQUIRED_PART_TAB_ID =
        'tab-part-body';

    const partTabsList =
        document.querySelector('.parts-tablist');

    const pagePartsPanels =
        document.getElementById('page-parts-panels');

    const partsStatus =
        document.getElementById('parts-status');

    const addPartButton =
        document.getElementById('add-part');

    const deletePartButton =
        document.getElementById('delete-part');

    const partsTabController =
        tabs.getController(partTabsList);

    /*
     * Content textareas
     */

    function getPartLabelForTextarea(textarea) {
        const panel =
            textarea.closest('[role="tabpanel"]');

        if (!panel) {
            return '';
        }

        const tabId =
            panel.getAttribute('aria-labelledby');

        const tab = tabId
            ? document.getElementById(tabId)
            : null;

        return tab?.textContent.trim() || '';
    }

    function updateContentPlaceholder(
        textarea,
        label = ''
    ) {
        if (!textarea) {
            return;
        }

        const partLabel =
            label || getPartLabelForTextarea(textarea);

        if (
            partLabel
            && textarea.value.trim() === ''
        ) {
            textarea.placeholder =
                `Content for ${partLabel}`;
            return;
        }

        textarea.removeAttribute('placeholder');
    }

    function resizeContentTextarea(textarea) {
        if (
            !textarea
            || textarea.offsetParent === null
        ) {
            return;
        }

        textarea.style.height = 'auto';
        textarea.style.height =
            `${textarea.scrollHeight}px`;
    }

    function initContentTextarea(
        textarea,
        label = ''
    ) {
        updateContentPlaceholder(
            textarea,
            label
        );

        resizeContentTextarea(textarea);

        textarea.addEventListener('input', () => {
            updateContentPlaceholder(
                textarea,
                label
            );

            resizeContentTextarea(textarea);
        });
    }

    document
        .querySelectorAll(
            CONTENT_TEXTAREA_SELECTOR
        )
        .forEach(initContentTextarea);

    /*
     * Status
     */

    function announceStatus(message) {
        if (partsStatus) {
            partsStatus.textContent = message;
        }
    }

    /*
     * Part helpers
     */

    function getPartTabs() {
        if (!partTabsList) {
            return [];
        }

        return [
            ...partTabsList.querySelectorAll(
                ':scope > [role="tab"]'
            ),
        ];
    }

    function getActivePartTab() {
        return getPartTabs().find(
            (tab) =>
                tab.getAttribute('aria-selected')
                === 'true'
        ) || null;
    }

    function isRequiredPart(tab) {
        return tab?.id === REQUIRED_PART_TAB_ID;
    }

    function updateDeleteButtonState(activeTab) {
        if (!deletePartButton) {
            return;
        }

        const required = isRequiredPart(activeTab);

        deletePartButton.disabled =
            required || getPartTabs().length <= 1;

        if (!activeTab) {
            return;
        }

        const partName =
            activeTab.textContent.trim();

        const label = required
            ? `The required part "${partName}" cannot be deleted`
            : `Delete part "${partName}"`;

        deletePartButton.setAttribute(
            'aria-label',
            label
        );

        deletePartButton.setAttribute(
            'data-tooltip',
            label
        );

        deletePartButton.setAttribute(
            'data-placement',
            'top'
        );
    }

    if (partTabsList) {
        partTabsList.addEventListener(
            'neowolf:tabchange',
            (event) => {
                const activeTab =
                    event.detail?.tab || null;

                updateDeleteButtonState(activeTab);

                if (!activeTab) {
                    return;
                }

                const panelId =
                    activeTab.getAttribute(
                        'aria-controls'
                    );

                const panel = panelId
                    ? document.getElementById(panelId)
                    : null;

                panel
                    ?.querySelectorAll(
                        CONTENT_TEXTAREA_SELECTOR
                    )
                    .forEach(
                        resizeContentTextarea
                    );
            }
        );

        updateDeleteButtonState(
            getActivePartTab()
        );
    }

    /*
     * Part-name helpers
     */

    function slugifyPartName(value) {
        return value
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function getExistingPartNames() {
        return getPartTabs().map(
            (tab) =>
                tab.textContent
                    .trim()
                    .toLowerCase()
        );
    }

    function sanitizePartNameInput(
        value,
        caretIndex
    ) {
        let result = '';
        let newCaret = 0;
        let previousWasSeparator = false;

        for (
            let index = 0;
            index < value.length;
            index += 1
        ) {
            const decomposed = value[index]
                .normalize('NFKD')
                .replace(
                    /[\u0300-\u036f]/g,
                    ''
                );

            let appended = '';

            for (const rawChar of decomposed) {
                const char =
                    rawChar.toLowerCase();

                if (
                    /\s/.test(char)
                    || char === '-'
                ) {
                    if (
                        !previousWasSeparator
                        && (result + appended).length > 0
                    ) {
                        appended += '-';
                    }

                    previousWasSeparator = true;
                    continue;
                }

                previousWasSeparator = false;

                if (/[a-z0-9_]/.test(char)) {
                    appended += char;
                }
            }

            result += appended;

            if (index < caretIndex) {
                newCaret += appended.length;
            }
        }

        return {
            value: result,
            caret: newCaret,
        };
    }

    function createUniquePartSlug(label) {
        const base =
            slugifyPartName(label) || 'part';

        let slug = base;
        let suffix = 2;

        while (
            document.getElementById(
                `tab-part-${slug}`
            )
            || document.getElementById(
                `panel-part-${slug}`
            )
        ) {
            slug = `${base}-${suffix}`;
            suffix += 1;
        }

        return slug;
    }

    /*
     * Part DOM creation
     */

    function createPartTab(
        tabId,
        panelId,
        label
    ) {
        const tab =
            document.createElement('button');

        tab.type = 'button';
        tab.id = tabId;
        tab.setAttribute('role', 'tab');
        tab.setAttribute(
            'aria-controls',
            panelId
        );
        tab.setAttribute(
            'aria-selected',
            'false'
        );
        tab.tabIndex = -1;
        tab.textContent = label;

        return tab;
    }

    function createPartPanel(
        panelId,
        tabId,
        label = ''
    ) {
        /*
         * Use a div rather than article. A tabpanel
         * is UI structure, not standalone article
         * content.
         */
        const panel =
            document.createElement('div');

        panel.id = panelId;
        panel.setAttribute(
            'role',
            'tabpanel'
        );
        panel.setAttribute(
            'aria-labelledby',
            tabId
        );
        panel.hidden = true;

        const filterFieldId =
            `${panelId}-filter`;

        const contentFieldId =
            `${panelId}-content`;

        const filterLabel =
            document.createElement('label');

        filterLabel.setAttribute(
            'for',
            filterFieldId
        );
        filterLabel.textContent = 'Filter';

        const filterSelect =
            document.createElement('select');

        filterSelect.id = filterFieldId;
        filterSelect.className =
            'filter-selector';

        filterSelect.append(
            new Option('— none —', ''),
            new Option(
                'Markdown',
                'markdown'
            )
        );

        const filterField =
            document.createElement('div');

        filterField.className =
            'status-field';

        filterField.append(
            filterLabel,
            filterSelect
        );

        const contentLabel =
            document.createElement('label');

        contentLabel.setAttribute(
            'for',
            contentFieldId
        );

        contentLabel.className =
            'visually-hidden';

        contentLabel.textContent =
            'Content';

        const contentTextarea =
            document.createElement('textarea');

        contentTextarea.className =
            'textarea markitup kubes_markdown';

        contentTextarea.id =
            contentFieldId;

        contentTextarea.rows = 14;
        contentTextarea.cols = 40;

        updateContentPlaceholder(
            contentTextarea,
            label
        );

        panel.append(
            filterField,
            contentLabel,
            contentTextarea
        );

        return {
            panel,
            contentTextarea,
        };
    }

    /*
     * Add part
     */

    const addPartDialog =
        document.getElementById(
            'add-part-dialog'
        );

    const closeAddPartDialogButton =
        document.getElementById(
            'close-add-part-dialog'
        );

    const addPartForm =
        document.getElementById(
            'add-part-form'
        );

    const partNameField =
        document.getElementById(
            'part-name-field'
        );

    if (addPartButton && addPartDialog) {
        dialog.blurOpenerAfterPointerClose(
            addPartDialog,
            addPartButton
        );

        addPartButton.addEventListener(
            'click',
            () => {
                if (partNameField) {
                    partNameField.value = '';
                    partNameField
                        .setCustomValidity('');
                }

                addPartDialog.showModal();
                partNameField?.focus();
            }
        );
    }

    closeAddPartDialogButton
        ?.addEventListener(
            'click',
            () => {
                addPartDialog?.close();
            }
        );

    if (partNameField) {
        partNameField.addEventListener(
            'input',
            () => {
                partNameField
                    .setCustomValidity('');

                const {
                    value,
                    selectionStart,
                } = partNameField;

                const sanitized =
                    sanitizePartNameInput(
                        value,
                        selectionStart
                            ?? value.length
                    );

                if (
                    sanitized.value === value
                ) {
                    return;
                }

                partNameField.value =
                    sanitized.value;

                partNameField
                    .setSelectionRange(
                        sanitized.caret,
                        sanitized.caret
                    );
            }
        );
    }

    if (
        addPartForm
        && partTabsList
        && pagePartsPanels
        && addPartDialog
        && partsTabController
    ) {
        addPartForm.addEventListener(
            'submit',
            (event) => {
                event.preventDefault();

                const label =
                    partNameField?.value.trim()
                    || '';

                if (!label) {
                    return;
                }

                if (
                    getExistingPartNames()
                        .includes(
                            label.toLowerCase()
                        )
                ) {
                    partNameField
                        ?.setCustomValidity(
                            `A part named "${label}" already exists.`
                        );

                    partNameField
                        ?.reportValidity();

                    return;
                }

                const slug =
                    createUniquePartSlug(label);

                const tabId =
                    `tab-part-${slug}`;

                const panelId =
                    `panel-part-${slug}`;

                const tab =
                    createPartTab(
                        tabId,
                        panelId,
                        label
                    );

                const {
                    panel,
                    contentTextarea,
                } = createPartPanel(
                    panelId,
                    tabId,
                    label
                );

                partTabsList.appendChild(tab);
                pagePartsPanels
                    .appendChild(panel);

                initContentTextarea(
                    contentTextarea,
                    label
                );

                partsTabController.attach(tab);

                partsTabController.activate(tab);

                addPartDialog.close();
                tab.focus();

                announceStatus(
                    `Part "${label}" added.`
                );
            }
        );
    }

    /*
     * Delete part
     */

    const deletePartDialog =
        document.getElementById(
            'delete-part-dialog'
        );

    const closeDeletePartDialogButton =
        document.getElementById(
            'close-delete-part-dialog'
        );

    const cancelDeletePartButton =
        document.getElementById(
            'cancel-delete-part'
        );

    const confirmDeletePartButton =
        document.getElementById(
            'confirm-delete-part'
        );

    const deletePartMessage =
        document.getElementById(
            'delete-part-message'
        );

    let partPendingDeletion = null;

    function closeDeletePartDialog() {
        if (deletePartDialog?.open) {
            deletePartDialog.close();
        }

        partPendingDeletion = null;
    }

    if (
        deletePartButton
        && deletePartDialog
    ) {
        dialog.blurOpenerAfterPointerClose(
            deletePartDialog,
            deletePartButton
        );

        deletePartButton.addEventListener(
            'click',
            () => {
                const activeTab =
                    getActivePartTab();

                if (
                    !activeTab
                    || isRequiredPart(activeTab)
                ) {
                    return;
                }

                partPendingDeletion =
                    activeTab;

                if (deletePartMessage) {
                    deletePartMessage.textContent =
                        `Are you sure you want to delete page part "${activeTab.textContent.trim()}"?`;
                }

                deletePartDialog.showModal();

                /*
                 * Default to the safe action so Enter
                 * cannot accidentally confirm deletion.
                 */
                cancelDeletePartButton?.focus();
            }
        );
    }

    closeDeletePartDialogButton
        ?.addEventListener(
            'click',
            closeDeletePartDialog
        );

    cancelDeletePartButton
        ?.addEventListener(
            'click',
            closeDeletePartDialog
        );

    if (
        confirmDeletePartButton
        && pagePartsPanels
        && partsTabController
    ) {
        confirmDeletePartButton
            .addEventListener(
                'click',
                () => {
                    const tabToDelete =
                        partPendingDeletion;

                    if (
                        !tabToDelete
                        || isRequiredPart(
                            tabToDelete
                        )
                    ) {
                        closeDeletePartDialog();
                        return;
                    }

                    const currentTabs =
                        partsTabController
                            .getTabs();

                    const index =
                        currentTabs.indexOf(
                            tabToDelete
                        );

                    const panelId =
                        tabToDelete.getAttribute(
                            'aria-controls'
                        );

                    const panel = panelId
                        ? document.getElementById(
                            panelId
                        )
                        : null;

                    const partName =
                        tabToDelete
                            .textContent
                            .trim();

                    tabToDelete.remove();
                    panel?.remove();

                    const remainingTabs =
                        currentTabs.filter(
                            (tab) =>
                                tab !== tabToDelete
                        );

                    const fallbackTab =
                        remainingTabs[index]
                        || remainingTabs[index - 1]
                        || remainingTabs[0];

                    if (fallbackTab) {
                        partsTabController.activate(
                            fallbackTab,
                            {moveFocus: true}
                        );
                    }

                    announceStatus(
                        `Part "${partName}" deleted.`
                    );

                    closeDeletePartDialog();
                }
            );
    }
})();
