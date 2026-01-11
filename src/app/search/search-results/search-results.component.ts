import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SearchService } from '../search.service';
import { SearchResponse, SearchQuery, SortOption, SearchFilters, ContentType, SearchResult } from '../search.models';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  searchResponse: SearchResponse | null = null;
  loading = false;
  error: string | null = null;
  currentQuery = '';
  currentSort: SortOption = 'relevance';
  currentPage = 1;
  pageSize = 25;
  showFilters = false;
  selectedTab: ContentType = 'all';
  selectedTabIndex = 0;

  // Cache sort and page size options to avoid creating new arrays on every change detection
  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date-desc', label: 'Date (Newest)' },
    { value: 'date-asc', label: 'Date (Oldest)' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'author-asc', label: 'Author (A-Z)' },
    { value: 'author-desc', label: 'Author (Z-A)' }
  ];
  readonly pageSizeOptions: number[] = [10, 25, 50];

  private destroy$ = new Subject<void>();
  private lastSearchParams: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Get initial params synchronously
    const initialParams = this.route.snapshot.queryParams;
    const query = initialParams['q'] || '';
    const page = parseInt(initialParams['page'] || '1', 10);
    const pageSize = parseInt(initialParams['pageSize'] || '25', 10);
    const sort = (initialParams['sort'] || 'relevance') as SortOption;

    this.currentQuery = query;
    this.currentPage = page;
    this.pageSize = pageSize;
    this.currentSort = sort;
    this.lastSearchParams = `${query}|${page}|${pageSize}|${sort}`;

    // Perform initial search if query exists
    if (this.currentQuery && this.currentQuery.trim()) {
      this.performSearch();
    }

    // Subscribe to route query params for subsequent changes
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const newQuery = params['q'] || '';
        const newPage = parseInt(params['page'] || '1', 10);
        const newPageSize = parseInt(params['pageSize'] || '25', 10);
        const newSort = (params['sort'] || 'relevance') as SortOption;

        // Create a unique key for this search to prevent duplicate searches
        const searchKey = `${newQuery}|${newPage}|${newPageSize}|${newSort}`;

        // Only search if parameters actually changed
        if (searchKey !== this.lastSearchParams) {
          this.currentQuery = newQuery;
          this.currentPage = newPage;
          this.pageSize = newPageSize;
          this.currentSort = newSort;
          this.lastSearchParams = searchKey;

          if (this.currentQuery && this.currentQuery.trim()) {
            this.performSearch();
          } else {
            // Clear results if no query
            this.searchResponse = null;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(query: string): void {
    this.currentQuery = query;
    this.currentPage = 1;
    this.navigateToResults();
  }

  onSortChange(sort: SortOption): void {
    this.currentSort = sort;
    this.currentPage = 1;
    this.navigateToResults();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.navigateToResults();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.navigateToResults();
  }

  onFiltersChange(filters: SearchFilters): void {
    // Prevent navigation loop - only navigate if we're not already loading
    if (!this.loading) {
      this.currentPage = 1;
      // Don't navigate immediately - let user apply filters manually
      // this.navigateToResults();
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  performSearch(): void {
    if (!this.currentQuery.trim()) {
      this.searchResponse = null;
      return;
    }

    // Prevent duplicate searches
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Get filters from query params (for advanced search) or filter sidebar
    const queryParams = this.route.snapshot.queryParams;
    const filters: SearchFilters = {};
    
    // Parse filters from query params (advanced search)
    if (queryParams['fileFormats']) {
      filters.fileFormats = Array.isArray(queryParams['fileFormats']) 
        ? queryParams['fileFormats'] 
        : queryParams['fileFormats'].split(',');
    }
    
    if (queryParams['contentTypes']) {
      filters.contentTypes = Array.isArray(queryParams['contentTypes']) 
        ? queryParams['contentTypes'] 
        : queryParams['contentTypes'].split(',');
    }
    
    if (queryParams['dateFrom']) {
      filters.dateFrom = new Date(queryParams['dateFrom']);
    }
    
    if (queryParams['dateTo']) {
      filters.dateTo = new Date(queryParams['dateTo']);
    }
    
    const searchQuery: SearchQuery = {
      query: this.currentQuery,
      sort: this.currentSort,
      page: this.currentPage,
      pageSize: this.pageSize,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    };

    this.searchService.search(searchQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchResponse = response;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'An error occurred while searching. Please try again.';
          this.loading = false;
          console.error('Search error:', err);
        }
      });
  }

  private navigateToResults(): void {
    const queryParams: any = {
      q: this.currentQuery,
      page: this.currentPage,
      pageSize: this.pageSize,
      sort: this.currentSort
    };

    // Check if we're already on the results page with the same params
    const currentParams = this.route.snapshot.queryParams;
    const currentKey = `${currentParams['q'] || ''}|${currentParams['page'] || '1'}|${currentParams['pageSize'] || '25'}|${currentParams['sort'] || 'relevance'}`;
    const newKey = `${this.currentQuery}|${this.currentPage}|${this.pageSize}|${this.currentSort}`;
    
    // Only navigate if params actually changed
    if (currentKey !== newKey) {
      this.router.navigate(['/search/results'], { queryParams, replaceUrl: true });
    }
  }

  getSortOptions(): { value: SortOption; label: string }[] {
    return this.sortOptions;
  }

  getPageSizeOptions(): number[] {
    return this.pageSizeOptions;
  }

  trackByResultId(index: number, result: any): string {
    return result.id;
  }

  onTabChange(tabIndex: number): void {
    const tabs: ContentType[] = ['all', 'news', 'video', 'images', 'sites'];
    this.selectedTab = tabs[tabIndex];
    this.selectedTabIndex = tabIndex;
    this.currentPage = 1;
    // Optionally trigger a new search with the content type filter
    // For now, we'll just filter the displayed results
  }

  getFilteredResults(): SearchResult[] {
    if (!this.searchResponse || !this.searchResponse.results) {
      return [];
    }

    if (this.selectedTab === 'all') {
      return this.searchResponse.results;
    }

    return this.searchResponse.results.filter(result => {
      // If result has contentType, use it; otherwise infer from fileType
      if (result.contentType) {
        return result.contentType === this.selectedTab;
      }
      
      // Infer content type from file type or other properties
      const fileType = result.fileType?.toLowerCase() || '';
      const url = result.url?.toLowerCase() || '';
      
      switch (this.selectedTab) {
        case 'images':
          return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].some(ext => 
            fileType.includes(ext) || url.includes(`.${ext}`)
          );
        case 'video':
          return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].some(ext => 
            fileType.includes(ext) || url.includes(`.${ext}`)
          );
        case 'news':
          return result.source?.toLowerCase().includes('news') || 
                 result.title?.toLowerCase().includes('news') ||
                 url.includes('/news/');
        case 'sites':
          return !['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].some(ext => 
            fileType.includes(ext) || url.includes(`.${ext}`)
          );
        default:
          return true;
      }
    });
  }

  getTabCounts(): { [key in ContentType]: number } {
    if (!this.searchResponse || !this.searchResponse.results) {
      return { all: 0, news: 0, video: 0, images: 0, sites: 0 };
    }

    const all = this.searchResponse.results.length;
    const news = this.searchResponse.results.filter(r => 
      r.source?.toLowerCase().includes('news') || 
      r.title?.toLowerCase().includes('news') ||
      r.url?.toLowerCase().includes('/news/')
    ).length;
    
    const video = this.searchResponse.results.filter(r => {
      const fileType = r.fileType?.toLowerCase() || '';
      const url = r.url?.toLowerCase() || '';
      return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].some(ext => 
        fileType.includes(ext) || url.includes(`.${ext}`)
      );
    }).length;
    
    const images = this.searchResponse.results.filter(r => {
      const fileType = r.fileType?.toLowerCase() || '';
      const url = r.url?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].some(ext => 
        fileType.includes(ext) || url.includes(`.${ext}`)
      );
    }).length;
    
    const sites = all - news - video - images;

    return { all, news, video, images, sites };
  }
}
