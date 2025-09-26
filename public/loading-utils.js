/* ==========================================================
   LOADING STATES & EMPTY STATES UTILITIES
   ========================================================== */

class LoadingManager {
    // Show loading overlay
    static showOverlay(text = 'Memuat...', subtext = '') {
        const existingOverlay = document.querySelector('.loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner large"></div>
                <div class="loading-text">${text}</div>
                ${subtext ? `<div class="loading-subtext">${subtext}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    }

    // Hide loading overlay
    static hideOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Show button loading state
    static showButtonLoading(button, text = '') {
        if (!button) return;

        button.disabled = true;
        button.classList.add('loading');

        if (text) {
            button.dataset.originalText = button.textContent;
            button.textContent = text;
        }
    }

    // Hide button loading state
    static hideButtonLoading(button) {
        if (!button) return;

        button.disabled = false;
        button.classList.remove('loading');

        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }

    // Show table loading state
    static showTableLoading(tableId, text = 'Memuat data...') {
        const table = document.getElementById(tableId) || document.querySelector(`[data-table-id="${tableId}"]`);
        if (!table) return;

        const container = table.closest('.table-container') || table.parentElement;
        if (!container) return;

        // Remove existing loading
        this.hideTableLoading(tableId);

        container.classList.add('table-loading');

        const loadingElement = document.createElement('div');
        loadingElement.className = 'table-loading-content';
        loadingElement.innerHTML = `
            <div class="loading-spinner large"></div>
            <div class="loading-text">${text}</div>
        `;

        container.appendChild(loadingElement);
    }

    // Hide table loading state
    static hideTableLoading(tableId) {
        const table = document.getElementById(tableId) || document.querySelector(`[data-table-id="${tableId}"]`);
        if (!table) return;

        const container = table.closest('.table-container') || table.parentElement;
        if (!container) return;

        container.classList.remove('table-loading');

        const loadingElement = container.querySelector('.table-loading-content');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    // Show skeleton loading for table
    static showSkeletonTable(tableBodyId, rowCount = 5) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;

        tbody.innerHTML = '';

        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement('tr');
            row.className = 'skeleton-table-row';

            // Get number of columns from header
            const table = tbody.closest('table');
            const headerCells = table ? table.querySelectorAll('thead th') : [];
            const columnCount = headerCells.length || 5;

            for (let j = 0; j < columnCount; j++) {
                const cell = document.createElement('td');
                cell.innerHTML = '<div class="skeleton-loader line"></div>';
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        }
    }

    // Show progress bar
    static showProgress(containerId, progress = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let progressBar = container.querySelector('.progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            container.appendChild(progressBar);
        }

        if (progress === null) {
            // Indeterminate progress
            progressBar.className = 'progress-bar indeterminate';
            progressBar.innerHTML = '';
        } else {
            // Determinate progress
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = `<div style="width: ${progress}%; height: 100%; background: #1a73e8; transition: width 0.3s ease;"></div>`;
        }
    }

    // Hide progress bar
    static hideProgress(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const progressBar = container.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.remove();
        }
    }
}

class EmptyStateManager {
    // Show empty state for table
    static showTableEmptyState(tableBodyId, emptyStateId) {
        const tbody = document.getElementById(tableBodyId);
        const emptyState = document.getElementById(emptyStateId);

        if (tbody) {
            tbody.innerHTML = '';
        }

        if (emptyState) {
            emptyState.style.display = 'flex';
        }
    }

    // Hide empty state for table
    static hideTableEmptyState(emptyStateId) {
        const emptyState = document.getElementById(emptyStateId);
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    // Show search empty state
    static showSearchEmptyState(containerId, searchTerm) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state no-search-results';
        emptyState.id = `${containerId}SearchEmpty`;
        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2"/>
                    <path d="M11 8v6M8 11h6" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <h3 class="empty-state-title">Tidak Ditemukan</h3>
            <p class="empty-state-description">
                Tidak ada hasil yang cocok dengan pencarian "<strong>${searchTerm}</strong>".
                Coba gunakan kata kunci yang berbeda.
            </p>
            <div class="empty-state-action">
                <button class="btn btn-secondary" onclick="clearSearch('${containerId}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Hapus Pencarian
                </button>
            </div>
        `;

        container.appendChild(emptyState);
        return emptyState;
    }

    // Hide search empty state
    static hideSearchEmptyState(containerId) {
        const searchEmpty = document.getElementById(`${containerId}SearchEmpty`);
        if (searchEmpty) {
            searchEmpty.remove();
        }
    }

    // Check if table has data and show/hide empty state accordingly
    static checkTableData(tableBodyId, emptyStateId) {
        const tbody = document.getElementById(tableBodyId);
        const emptyState = document.getElementById(emptyStateId);

        if (!tbody || !emptyState) return;

        const hasData = tbody.children.length > 0 &&
                       !tbody.querySelector('.skeleton-table-row');

        if (hasData) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'flex';
        }
    }

    // Generic empty state creator
    static createEmptyState(options = {}) {
        const {
            icon = '<circle cx="12" cy="12" r="3"/>',
            title = 'Tidak ada data',
            description = 'Belum ada data untuk ditampilkan.',
            actions = []
        } = options;

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state no-data';

        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="empty-state-action">
                    ${actions.map(action => `
                        <button class="btn ${action.class || 'btn-primary'}" onclick="${action.onclick || ''}">
                            ${action.icon || ''}
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    ${icon}
                </svg>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-description">${description}</p>
            ${actionsHtml}
        `;

        return emptyState;
    }
}

// Global helper functions
window.clearSearch = function(containerId) {
    const searchInput = document.querySelector(`#${containerId} input[type="search"], input[data-table-id="${containerId}"]`);
    if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    EmptyStateManager.hideSearchEmptyState(containerId);
};

// Export classes for global use
window.LoadingManager = LoadingManager;
window.EmptyStateManager = EmptyStateManager;