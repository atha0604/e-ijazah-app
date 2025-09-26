// Search Sekolah Module
class SekolahSearch {
    constructor() {
        this.currentPage = 1;
        this.limit = 20;
        this.searchTerm = '';
        this.selectedKecamatan = '';
        this.sortBy = 'namaSekolahLengkap';
        this.sortOrder = 'ASC';
        this.isLoading = false;
        this.debounceTimer = null;

        this.initializeElements();
        this.attachEventListeners();
        this.loadKecamatanOptions();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchSekolah');
        this.kecamatanFilter = document.getElementById('filterKecamatan');
        this.sortSelect = document.getElementById('sortSekolah');
        this.resetButton = document.getElementById('resetFilterSekolah');
        this.clearSearchButton = document.getElementById('clearSearch');
        this.resultsInfo = document.getElementById('searchResultsInfo');
        this.resultsText = document.getElementById('searchResultsText');
        this.tableContainer = document.querySelector('#sekolah .table-container');
        this.sekolahCount = document.getElementById('sekolahCount');
    }

    attachEventListeners() {
        // Search input with debounce
        this.searchInput.addEventListener('input', (e) => {
            this.debounceSearch(e.target.value);
        });

        // Filter changes
        this.kecamatanFilter.addEventListener('change', (e) => {
            this.selectedKecamatan = e.target.value;
            this.currentPage = 1;
            this.performSearch();
        });

        this.sortSelect.addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split(':');
            this.sortBy = sortBy;
            this.sortOrder = sortOrder;
            this.currentPage = 1;
            this.performSearch();
        });

        // Reset and clear buttons
        this.resetButton.addEventListener('click', () => {
            this.resetFilters();
        });

        this.clearSearchButton.addEventListener('click', () => {
            this.clearSearch();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            }
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    debounceSearch(value) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.searchTerm = value.trim();
            this.currentPage = 1;
            this.performSearch();
        }, 300);
    }

    async loadKecamatanOptions() {
        try {
            const response = await fetch('/api/data/rekap/kecamatan', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.populateKecamatanFilter(data.data);
            }
        } catch (error) {
            console.error('Error loading kecamatan options:', error);
        }
    }

    populateKecamatanFilter(kecamatanData) {
        this.kecamatanFilter.innerHTML = '<option value="">Semua Kecamatan</option>';

        kecamatanData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.kecamatan;
            option.textContent = `${item.kecamatan} (${item.jumlahSekolah} sekolah)`;
            this.kecamatanFilter.appendChild(option);
        });
    }

    async performSearch() {
        if (this.isLoading) return;

        this.setLoadingState(true);

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });

            if (this.searchTerm) {
                params.append('q', this.searchTerm);
            }

            if (this.selectedKecamatan) {
                params.append('kecamatan', this.selectedKecamatan);
            }

            const response = await fetch(`/api/data/sekolah/search?${params}`);

            if (response.ok) {
                const data = await response.json();
                this.displayResults(data.data);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Gagal melakukan pencarian. Silakan coba lagi.');
        } finally {
            this.setLoadingState(false);
        }
    }

    displayResults(data) {
        const { sekolah, pagination, filters } = data;

        // Update results info
        this.updateResultsInfo(pagination);

        // Update table
        this.updateTable(sekolah);

        // Update pagination
        this.updatePagination(pagination);

        // Update count
        this.sekolahCount.textContent = pagination.totalRecords;

        // Show/hide results info banner
        if (this.searchTerm || this.selectedKecamatan) {
            this.showResultsInfo(pagination);
        } else {
            this.hideResultsInfo();
        }
    }

    updateResultsInfo(pagination) {
        const { currentPage, totalPages, totalRecords, recordsPerPage } = pagination;
        const startRecord = ((currentPage - 1) * recordsPerPage) + 1;
        const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

        this.resultsText.textContent =
            `Menampilkan ${startRecord}-${endRecord} dari ${totalRecords} hasil`;
    }

    showResultsInfo(pagination) {
        let searchDesc = [];

        if (this.searchTerm) {
            searchDesc.push(`"${this.searchTerm}"`);
        }

        if (this.selectedKecamatan) {
            searchDesc.push(`di ${this.selectedKecamatan}`);
        }

        this.resultsText.textContent =
            `Ditemukan ${pagination.totalRecords} sekolah untuk pencarian ${searchDesc.join(' ')}`;

        this.resultsInfo.style.display = 'flex';
    }

    hideResultsInfo() {
        this.resultsInfo.style.display = 'none';
    }

    updateTable(sekolahData) {
        const tbody = document.getElementById('sekolahTableBody');

        if (sekolahData.length === 0) {
            this.showNoResults();
            return;
        }

        // Mark table as search results for enhanced styling
        this.tableContainer.classList.add('search-results');

        tbody.innerHTML = '';

        sekolahData.forEach((sekolah, index) => {
            const row = document.createElement('tr');

            // Highlight search terms
            const highlightedData = this.highlightSearchTerms(sekolah);

            row.innerHTML = `
                <td>${highlightedData.kodeBiasa}</td>
                <td>${highlightedData.kodePro || '-'}</td>
                <td>${highlightedData.kecamatan}</td>
                <td>${highlightedData.npsn || '-'}</td>
                <td>${highlightedData.namaSekolahLengkap}</td>
                <td>${highlightedData.namaSekolahSingkat || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="editSekolah('${sekolah.kodeBiasa}')" title="Edit Sekolah">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSekolah('${sekolah.kodeBiasa}')" title="Hapus Sekolah">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <span class="student-count" title="Jumlah Siswa">${sekolah.jumlahSiswa || 0} siswa</span>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    highlightSearchTerms(sekolah) {
        if (!this.searchTerm) return sekolah;

        const highlighted = { ...sekolah };
        const searchRegex = new RegExp(`(${this.searchTerm})`, 'gi');

        ['kodeBiasa', 'kodePro', 'npsn', 'namaSekolahLengkap', 'namaSekolahSingkat'].forEach(field => {
            if (highlighted[field]) {
                highlighted[field] = highlighted[field].replace(searchRegex, '<span class="search-highlight">$1</span>');
            }
        });

        return highlighted;
    }

    showNoResults() {
        const tbody = document.getElementById('sekolahTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3>Tidak ada sekolah yang ditemukan</h3>
                    <p>Coba ubah kata kunci pencarian atau filter yang digunakan.</p>
                </td>
            </tr>
        `;
    }

    updatePagination(pagination) {
        const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;

        // Find or create pagination container
        let paginationContainer = document.querySelector('#sekolah .search-pagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'search-pagination';
            this.tableContainer.parentNode.appendChild(paginationContainer);
        }

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Halaman ${currentPage} dari ${totalPages}
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" ${!hasPrevPage ? 'disabled' : ''} data-page="1">
                    ««
                </button>
                <button class="pagination-btn" ${!hasPrevPage ? 'disabled' : ''} data-page="${currentPage - 1}">
                    ‹ Sebelumnya
                </button>
                ${this.generatePageNumbers(currentPage, totalPages)}
                <button class="pagination-btn" ${!hasNextPage ? 'disabled' : ''} data-page="${currentPage + 1}">
                    Berikutnya ›
                </button>
                <button class="pagination-btn" ${!hasNextPage ? 'disabled' : ''} data-page="${totalPages}">
                    »»
                </button>
            </div>
        `;

        // Attach pagination event listeners
        paginationContainer.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!e.target.disabled) {
                    this.currentPage = parseInt(e.target.dataset.page);
                    this.performSearch();
                }
            });
        });
    }

    generatePageNumbers(currentPage, totalPages) {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return pages.join('');
    }

    setLoadingState(loading) {
        this.isLoading = loading;

        if (loading) {
            this.searchInput.classList.add('search-loading');
            document.body.style.cursor = 'wait';
        } else {
            this.searchInput.classList.remove('search-loading');
            document.body.style.cursor = '';
        }
    }

    resetFilters() {
        this.searchInput.value = '';
        this.kecamatanFilter.value = '';
        this.sortSelect.value = 'namaSekolahLengkap:ASC';

        this.searchTerm = '';
        this.selectedKecamatan = '';
        this.sortBy = 'namaSekolahLengkap';
        this.sortOrder = 'ASC';
        this.currentPage = 1;

        this.hideResultsInfo();
        this.tableContainer.classList.remove('search-results');

        // Reload original data
        if (typeof populateTable === 'function') {
            populateTable('sekolah');
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.currentPage = 1;
        this.performSearch();
    }

    showError(message) {
        // Create or update error notification
        let errorDiv = document.querySelector('.search-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'search-error';
            errorDiv.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 0.75rem 1rem;
                border: 1px solid #f5c6cb;
                border-radius: 6px;
                margin-bottom: 1rem;
            `;
            this.tableContainer.parentNode.insertBefore(errorDiv, this.tableContainer);
        }

        errorDiv.textContent = message;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize search when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the admin page and sekolah section exists
    if (document.getElementById('searchSekolah')) {
        window.sekolahSearch = new SekolahSearch();
    }
});

// Export for external use
window.SekolahSearch = SekolahSearch;