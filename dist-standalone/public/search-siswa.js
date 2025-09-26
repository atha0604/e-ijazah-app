/**
 * Sistem Pencarian dan Filter untuk Database Siswa
 * Mirip dengan search-sekolah.js namun disesuaikan untuk data siswa
 */

class SiswaSearch {
    constructor() {
        this.originalData = [];
        this.filteredData = [];
        this.isInitialized = false;

        // Elements
        this.searchInput = document.getElementById('searchSiswa');
        this.sekolahFilter = document.getElementById('filterSekolahSiswa');
        this.sortSelect = document.getElementById('sortSiswa');
        this.resetButton = document.getElementById('resetFilterSiswa');
        this.clearSearchButton = document.getElementById('clearSearchSiswa');
        this.resultsInfo = document.getElementById('searchResultsInfoSiswa');

        this.bindEvents();
    }

    init() {
        if (this.isInitialized) return;

        this.originalData = window.database?.siswa || [];
        this.filteredData = [...this.originalData];

        console.log('SiswaSearch initialized with', this.originalData.length, 'students');

        if (this.originalData.length === 0) {
            console.warn('SiswaSearch: No student data found in database');
        }

        this.populateSekolahFilter();
        this.updateResultsInfo();
        this.isInitialized = true;
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => {
                this.performSearch();
            }, 300));
        }

        if (this.sekolahFilter) {
            this.sekolahFilter.addEventListener('change', () => {
                this.performSearch();
            });
        }

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => {
                this.performSearch();
            });
        }

        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        if (this.clearSearchButton) {
            this.clearSearchButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    populateSekolahFilter() {
        if (!this.sekolahFilter) return;

        // Get unique schools from student data
        const schools = new Set();
        this.originalData.forEach(siswa => {
            if (siswa[2]) { // nama sekolah ada di index 2
                schools.add(siswa[2]);
            }
        });

        // Clear existing options except "Semua Sekolah"
        this.sekolahFilter.innerHTML = '<option value="">Semua Sekolah</option>';

        // Add school options
        Array.from(schools).sort().forEach(school => {
            const option = document.createElement('option');
            option.value = school;
            option.textContent = school;
            this.sekolahFilter.appendChild(option);
        });
    }

    performSearch() {
        const searchTerm = this.searchInput?.value.toLowerCase().trim() || '';
        const schoolFilter = this.sekolahFilter?.value || '';
        const sortOption = this.sortSelect?.value || 'namaPeserta:ASC';

        console.log('SiswaSearch - performSearch called with term:', searchTerm);
        console.log('SiswaSearch - originalData length:', this.originalData.length);

        // Start with original data
        this.filteredData = [...this.originalData];

        // Apply search filter
        if (searchTerm) {
            this.filteredData = this.filteredData.filter(siswa => {
                const searchableFields = [
                    siswa[7] || '', // NISN - index 7
                    siswa[5] || '', // NIS - index 5
                    siswa[8] || '', // Nama Peserta - index 8
                    siswa[10] || '', // Nama Orang Tua - index 10
                    siswa[2] || '', // Nama Sekolah - index 2
                    siswa[11] || '' // No Ijazah - index 11
                ];

                return searchableFields.some(field =>
                    field.toString().toLowerCase().includes(searchTerm)
                );
            });

            console.log('SiswaSearch - After search, found:', this.filteredData.length, 'results');
        } else {
            console.log('SiswaSearch - No search term, showing all', this.filteredData.length, 'students');
        }

        // Apply school filter
        if (schoolFilter) {
            this.filteredData = this.filteredData.filter(siswa =>
                siswa[2] === schoolFilter
            );
        }

        // Apply sorting
        this.applySorting(sortOption);

        // Update results info
        this.updateResultsInfo();

        // Update table with filtered data
        this.updateTable();
    }

    applySorting(sortOption) {
        const [field, direction] = sortOption.split(':');
        const isAscending = direction === 'ASC';

        const fieldMapping = {
            'namaPeserta': 8,
            'nisn': 7,
            'namaSekolah': 2,
            'namaOrtu': 10,
            'nis': 5
        };

        const fieldIndex = fieldMapping[field] || 8;

        this.filteredData.sort((a, b) => {
            const aVal = (a[fieldIndex] || '').toString().toLowerCase();
            const bVal = (b[fieldIndex] || '').toString().toLowerCase();

            if (fieldIndex === 7 || fieldIndex === 5) { // NISN or NIS - numeric comparison
                const aNum = parseInt(aVal) || 0;
                const bNum = parseInt(bVal) || 0;
                return isAscending ? aNum - bNum : bNum - aNum;
            }

            // String comparison
            if (aVal < bVal) return isAscending ? -1 : 1;
            if (aVal > bVal) return isAscending ? 1 : -1;
            return 0;
        });
    }

    updateResultsInfo() {
        if (!this.resultsInfo) return;

        const totalCount = this.originalData.length;
        const filteredCount = this.filteredData.length;
        const searchTerm = this.searchInput?.value || '';
        const schoolFilter = this.sekolahFilter?.value || '';

        let infoText = '';

        if (searchTerm || schoolFilter) {
            infoText = `Menampilkan ${filteredCount} dari ${totalCount} siswa`;

            if (searchTerm) {
                infoText += ` untuk "${searchTerm}"`;
            }

            if (schoolFilter) {
                infoText += ` di ${schoolFilter}`;
            }
        } else {
            infoText = `Total ${totalCount} siswa`;
        }

        this.resultsInfo.textContent = infoText;
        this.resultsInfo.style.display = (searchTerm || schoolFilter) ? 'block' : 'none';
    }

    updateTable() {
        // Just trigger re-render of the table
        // The renderAdminTable function will call getFilteredData() to get our filtered data
        if (typeof window.renderAdminTable === 'function') {
            window.renderAdminTable('siswa');
        }
    }

    resetFilters() {
        if (this.searchInput) this.searchInput.value = '';
        if (this.sekolahFilter) this.sekolahFilter.value = '';
        if (this.sortSelect) this.sortSelect.value = 'namaPeserta:ASC';

        this.performSearch();
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.performSearch();
        }
    }

    // Utility: Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public method to refresh data when database is updated
    refreshData() {
        this.originalData = window.database?.siswa || [];
        this.populateSekolahFilter();
        this.performSearch();
    }

    // Public method to get current filtered data
    getFilteredData() {
        return this.filteredData;
    }

    // Public method to get current search state
    getSearchState() {
        return {
            searchTerm: this.searchInput?.value || '',
            schoolFilter: this.sekolahFilter?.value || '',
            sortOption: this.sortSelect?.value || 'namaPeserta:ASC'
        };
    }
}

// Initialize when DOM is ready - TEMPORARILY DISABLED
// document.addEventListener('DOMContentLoaded', () => {
//     if (document.getElementById('searchSiswa')) {
//         window.siswaSearch = new SiswaSearch();
//     }
// });

// Export for external use
window.SiswaSearch = SiswaSearch;