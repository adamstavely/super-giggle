import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ViewChild, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SearchService } from '../search.service';
import { SearchResponse, SearchQuery, SortOption, SearchFilters, ContentType, SearchResult } from '../search.models';
import { PrefetchService } from '../../core/services/prefetch.service';
import { ClientIndexService } from '../../core/services/client-index.service';
import { CacheService } from '../../core/services/cache.service';
import { KeyboardShortcutsService } from '../../core/services/keyboard-shortcuts.service';
import { MatDialog } from '@angular/material/dialog';
import { KeyboardShortcutsHelpComponent } from '../keyboard-shortcuts-help/keyboard-shortcuts-help.component';
import { UndoRedoService } from '../../core/services/undo-redo.service';
import { ErrorService } from '../../core/services/error.service';
import { QueryProcessingService } from '../../core/services/query-processing.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  searchResponse: SearchResponse | null = null;
  loading = false;
  error: string | null = null;
  isUpdating = false; // For optimistic UI updates
  cachedResponse: SearchResponse | null = null; // For optimistic UI
  currentQuery = '';
  currentSort: SortOption = 'relevance';
  currentPage = 1;
  pageSize = 25;
  showFilters = true; // Show filters by default on desktop
  selectedTab: ContentType = 'all';
  selectedTabIndex = 0;
  groupBySource = false;
  expandedSources = new Set<string>();
  
  // Quick View Panel
  quickViewResult: SearchResult | null = null;
  quickViewOpen = false;

  // Featured Results
  featuredResults: SearchResult[] = [];

  // Keyboard navigation
  selectedResultIndex = -1;
  @ViewChildren('resultItem') resultItems!: QueryList<ElementRef>;

  // UX Polish features
  spellingSuggestion: string | null = null;
  relatedSearches: string[] = [];
  popularSearches: string[] = [];
  errorDetails: string | null = null;
  retryCount = 0;
  maxRetries = 3;
  isOffline = false;


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
    private searchService: SearchService,
    private prefetchService: PrefetchService,
    private clientIndexService: ClientIndexService,
    private cacheService: CacheService,
    private keyboardShortcuts: KeyboardShortcutsService,
    private dialog: MatDialog,
    private undoRedoService: UndoRedoService,
    private errorService: ErrorService,
    private queryProcessing: QueryProcessingService,
    private cdr: ChangeDetectorRef
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
    
    // Register keyboard shortcuts for search results
    this.registerKeyboardShortcuts();

    // Register undo/redo shortcuts
    this.registerUndoRedoShortcuts();

    // Check online status
    this.checkOnlineStatus();

    // Load popular searches
    this.loadPopularSearches();

    // Save initial state
    if (this.currentQuery) {
      this.saveState();
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshSearch(): void {
    if (this.currentQuery) {
      this.performSearch();
    }
  }

  onSearch(query: string): void {
    this.currentQuery = query;
    this.currentPage = 1;
    this.saveState(); // Save state before navigation
    this.navigateToResults();
  }

  onSortChange(sort: SortOption): void {
    this.currentSort = sort;
    this.currentPage = 1;
    this.saveState(); // Save state before navigation
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
    if (this.loading && !this.cachedResponse) {
      return;
    }

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

    // Check cache first for optimistic UI
    const cacheKey = this.cacheService.generateSearchKey(
      this.currentQuery,
      filters,
      this.currentSort,
      this.currentPage,
      this.pageSize
    );

    this.cacheService.get<SearchResponse>(cacheKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cachedResponse => {
        if (cachedResponse) {
          // Show cached results immediately (optimistic UI)
          this.searchResponse = cachedResponse;
          this.cachedResponse = cachedResponse;
          this.isUpdating = true; // Show updating indicator
          
          // Index results for client-side operations
          this.clientIndexService.indexResults(cachedResponse.results);
          
          // Load curated featured results for cached query
          this.loadCuratedFeaturedResults();
        } else {
          // No cache, show loading
          this.loading = true;
        }
      });

    this.error = null;

    // Perform actual search (will update cache and refresh)
    this.searchService.search(searchQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchResponse = response;
          this.cachedResponse = null;
          this.loading = false;
          this.isUpdating = false;
          
          // Index results for client-side operations
          this.clientIndexService.indexResults(response.results);
          
          // Fetch curated featured results for the current query
          this.loadCuratedFeaturedResults();
          
          // Prefetch next page if applicable
          this.prefetchNextPage(searchQuery, response);
        },
        error: (err) => {
          this.handleSearchError(err);
        }
      });
  }

  /**
   * Prefetch next page if user is near bottom
   */
  private prefetchNextPage(query: SearchQuery, response: SearchResponse): void {
    if (this.currentPage < response.totalPages) {
      this.prefetchService.prefetchNextPage(query).subscribe({
        next: (prefetchedResponse) => {
          if (prefetchedResponse) {
            // Prefetched results are now in cache, ready for instant loading
            console.log('Next page prefetched');
          }
        }
      });
    }
  }

  /**
   * Handle scroll for prefetching
   */
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (!this.searchResponse || this.loading) {
      return;
    }

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    const queryParams = this.route.snapshot.queryParams;
    const filters: SearchFilters = {};
    
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
    
    const searchQuery: SearchQuery = {
      query: this.currentQuery,
      sort: this.currentSort,
      page: this.currentPage,
      pageSize: this.pageSize,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    };

    if (this.prefetchService.shouldPrefetch(
      this.currentPage,
      this.searchResponse.totalPages,
      scrollPosition,
      pageHeight
    )) {
      this.prefetchService.prefetchNextPage(searchQuery).subscribe();
    }
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

    // Use client-side indexing for fast filtering if available
    let results = this.searchResponse.results;

    // Apply client-side filtering if filters are active
    const queryParams = this.route.snapshot.queryParams;
    const hasFilters = queryParams['fileFormats'] || queryParams['contentTypes'] || 
                      queryParams['dateFrom'] || queryParams['dateTo'] ||
                      queryParams['departments'] || queryParams['authors'] ||
                      queryParams['sourceSystems'];

    if (hasFilters) {
      const filters: SearchFilters = {};
      
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
      
      if (queryParams['sourceSystems']) {
        filters.sourceSystems = Array.isArray(queryParams['sourceSystems'])
          ? queryParams['sourceSystems']
          : queryParams['sourceSystems'].split(',');
      }
      
      if (queryParams['authors']) {
        filters.authors = Array.isArray(queryParams['authors'])
          ? queryParams['authors']
          : queryParams['authors'].split(',');
      }

      // Use client-side indexing for fast filtering
      this.clientIndexService.filterResults(filters).subscribe(filtered => {
        if (filtered.length > 0) {
          results = filtered;
        }
      });
    }

    // Apply content type filter
    if (this.selectedTab === 'all') {
      return results;
    }

    return results.filter(result => {
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

  /**
   * Load curated featured results for the current search query
   */
  private loadCuratedFeaturedResults(): void {
    if (!this.currentQuery || !this.currentQuery.trim()) {
      this.featuredResults = [];
      this.cdr.markForCheck();
      return;
    }

    const query = this.currentQuery.trim();
    this.searchService.getCuratedFeaturedResults(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          // Only update if the query hasn't changed
          if (this.currentQuery.trim() === query) {
            this.featuredResults = results;
            console.log('Featured results loaded:', results.length, 'for query:', query);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error loading curated featured results:', err);
          if (this.currentQuery.trim() === query) {
            this.featuredResults = [];
            this.cdr.markForCheck();
          }
        }
      });
  }

  getFeaturedResults(): SearchResult[] {
    return this.featuredResults;
  }

  hasFeaturedResults(): boolean {
    return this.featuredResults.length > 0;
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

  toggleGroupBySource(): void {
    this.groupBySource = !this.groupBySource;
    if (this.groupBySource) {
      // Expand all sources by default
      this.getGroupedResults().forEach(group => {
        this.expandedSources.add(group.source);
      });
    }
  }

  toggleSource(source: string): void {
    if (this.expandedSources.has(source)) {
      this.expandedSources.delete(source);
    } else {
      this.expandedSources.add(source);
    }
  }

  isSourceExpanded(source: string): boolean {
    return this.expandedSources.has(source);
  }

  getGroupedResults(): Array<{ source: string; results: SearchResult[] }> {
    if (!this.searchResponse || !this.searchResponse.results) {
      return [];
    }

    const results = this.getFilteredResults();
    const grouped = new Map<string, SearchResult[]>();

    results.forEach(result => {
      const source = result.source || 'Unknown';
      if (!grouped.has(source)) {
        grouped.set(source, []);
      }
      grouped.get(source)!.push(result);
    });

    // Convert to array and sort by source name
    return Array.from(grouped.entries())
      .map(([source, results]) => ({ source, results }))
      .sort((a, b) => a.source.localeCompare(b.source));
  }

  getSourceCount(source: string): number {
    const grouped = this.getGroupedResults();
    const group = grouped.find(g => g.source === source);
    return group ? group.results.length : 0;
  }

  getTotalPages(): number {
    if (!this.searchResponse || !this.searchResponse.totalCount) {
      return 1;
    }
    // Use totalPages if available, otherwise calculate
    return this.searchResponse.totalPages || Math.ceil(this.searchResponse.totalCount / this.pageSize);
  }

  onOpenQuickView(result: SearchResult): void {
    this.quickViewResult = result;
    this.quickViewOpen = true;
  }

  onCloseQuickView(): void {
    this.quickViewOpen = false;
    this.quickViewResult = null;
  }

  onNavigateQuickView(index: number): void {
    const results = this.getFilteredResults();
    if (index >= 0 && index < results.length) {
      // Create a new object reference to trigger change detection
      this.quickViewResult = { ...results[index] };
    }
  }

  onShareResult(result: SearchResult): void {
    // TODO: Implement share functionality
    console.log('Share result:', result);
  }

  onBookmarkResult(result: SearchResult): void {
    // TODO: Implement bookmark functionality
    console.log('Bookmark result:', result);
  }

  /**
   * Register keyboard shortcuts for search results context
   */
  private registerKeyboardShortcuts(): void {
    // / key - Focus search bar
    this.keyboardShortcuts.registerShortcut({
      key: '/',
      description: 'Focus search bar',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    });

    // Esc - Clear search / Close modals
    this.keyboardShortcuts.registerShortcut({
      key: 'Escape',
      description: 'Clear search or close modals',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.quickViewOpen) {
        this.onCloseQuickView();
      } else if (this.currentQuery) {
        this.currentQuery = '';
        this.searchResponse = null;
        this.selectedResultIndex = -1;
        this.router.navigate(['/search']);
      }
    });

    // Arrow keys - Navigate results
    this.keyboardShortcuts.registerShortcut({
      key: 'ArrowDown',
      description: 'Navigate to next result',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.navigateResults('down');
    });

    this.keyboardShortcuts.registerShortcut({
      key: 'ArrowUp',
      description: 'Navigate to previous result',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.navigateResults('up');
    });

    // Enter - Open selected result
    this.keyboardShortcuts.registerShortcut({
      key: 'Enter',
      description: 'Open selected result',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.openSelectedResult();
    });

    // ? - Show shortcuts help
    this.keyboardShortcuts.registerShortcut({
      key: '?',
      description: 'Show keyboard shortcuts help',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showShortcutsHelp();
    });

    // Ctrl/Cmd + F - Find in results
    this.keyboardShortcuts.registerShortcut({
      key: 'f',
      ctrl: true,
      description: 'Find in results',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.focusFindInResults();
    });

    // Ctrl/Cmd + S - Save search
    this.keyboardShortcuts.registerShortcut({
      key: 's',
      ctrl: true,
      description: 'Save current search',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.saveCurrentSearch();
    });

    // Ctrl/Cmd + / - Toggle filters
    this.keyboardShortcuts.registerShortcut({
      key: '/',
      ctrl: true,
      description: 'Toggle filters sidebar',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.toggleFilters();
    });
  }

  /**
   * Navigate results with arrow keys
   */
  private navigateResults(direction: 'up' | 'down'): void {
    const results = this.getFilteredResults();
    if (results.length === 0) {
      this.selectedResultIndex = -1;
      return;
    }

    // Initialize if not set
    if (this.selectedResultIndex < 0) {
      this.selectedResultIndex = direction === 'down' ? 0 : results.length - 1;
    } else if (direction === 'down') {
      this.selectedResultIndex = Math.min(this.selectedResultIndex + 1, results.length - 1);
    } else {
      this.selectedResultIndex = Math.max(this.selectedResultIndex - 1, 0);
    }

    // Scroll selected result into view and focus it
    setTimeout(() => {
      const resultItemsArray = this.resultItems.toArray();
      if (this.selectedResultIndex >= 0 && this.selectedResultIndex < resultItemsArray.length) {
        const selectedElement = resultItemsArray[this.selectedResultIndex];
        if (selectedElement && selectedElement.nativeElement) {
          selectedElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Make the card focusable and focus it
          const card = selectedElement.nativeElement.querySelector('mat-card') as HTMLElement;
          if (card) {
            card.setAttribute('tabindex', '0');
            card.focus();
          }
        }
      }
    }, 0);
  }

  /**
   * Open the currently selected result
   */
  private openSelectedResult(): void {
    if (this.selectedResultIndex >= 0) {
      const results = this.getFilteredResults();
      if (this.selectedResultIndex < results.length) {
        const selectedResult = results[this.selectedResultIndex];
        window.open(selectedResult.url, '_blank');
      }
    }
  }

  /**
   * Show keyboard shortcuts help dialog
   */
  private showShortcutsHelp(): void {
    this.dialog.open(KeyboardShortcutsHelpComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { context: 'search-results' },
      ariaLabel: 'Keyboard shortcuts help'
    });
  }

  /**
   * Focus find in results input (if exists) or create one
   */
  private focusFindInResults(): void {
    // For now, just focus the main search bar
    // In a full implementation, this would open a "Find in results" input
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }

  /**
   * Save current search as template
   */
  private saveCurrentSearch(): void {
    // TODO: Implement save search functionality
    // This would open a dialog to save the current search query and filters
    console.log('Save search:', {
      query: this.currentQuery,
      filters: this.route.snapshot.queryParams,
      sort: this.currentSort
    });
  }

  /**
   * Handle search error with enhanced recovery
   */
  private handleSearchError(err: any): void {
    const errorInfo = this.errorService.getErrorInfo(err);
    this.error = this.errorService.getErrorMessage(err);
    this.errorDetails = errorInfo.type === 'server' ? 'Server error occurred' : null;

    // Check if offline
    if (err instanceof HttpErrorResponse && err.status === 0) {
      this.isOffline = true;
      this.error = 'You appear to be offline. Please check your internet connection.';
    }

    // On error, keep cached response if available
    if (this.cachedResponse) {
      this.searchResponse = this.cachedResponse;
      this.isUpdating = false;
      // Show error but don't clear results
      this.error = 'Unable to refresh results. Showing cached data.';
    } else {
      this.searchResponse = null;
    }

    this.loading = false;
    this.retryCount = 0;

    // Generate suggestions for empty state
    if (!this.cachedResponse) {
      this.generateEmptyStateSuggestions();
    }

    console.error('Search error:', err);
  }

  /**
   * Retry search with exponential backoff
   */
  retrySearch(): void {
    if (this.retryCount >= this.maxRetries) {
      this.error = 'Maximum retry attempts reached. Please try again later.';
      return;
    }

    this.retryCount++;
    const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000); // Max 10 seconds

    setTimeout(() => {
      this.error = null;
      this.errorDetails = null;
      this.performSearch();
    }, delay);
  }

  /**
   * Get error icon based on error type
   */
  getErrorIcon(): string {
    if (this.isOffline) {
      return 'wifi_off';
    }
    return 'error_outline';
  }

  /**
   * Get error title
   */
  getErrorTitle(): string {
    if (this.isOffline) {
      return 'Connection Error';
    }
    return 'Search Error';
  }

  /**
   * Check online status
   */
  private checkOnlineStatus(): void {
    this.isOffline = !navigator.onLine;

    window.addEventListener('online', () => {
      this.isOffline = false;
      if (this.error && this.error.includes('offline')) {
        this.error = null;
        this.retrySearch();
      }
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
    });
  }

  /**
   * Generate suggestions for empty state
   */
  private generateEmptyStateSuggestions(): void {
    // Check spelling
    if (this.currentQuery) {
      this.queryProcessing.checkSpelling(this.currentQuery)
        .pipe(takeUntil(this.destroy$))
        .subscribe(spellCheck => {
          if (spellCheck && spellCheck.suggestions.length > 0) {
            this.spellingSuggestion = spellCheck.suggestions[0];
          } else {
            this.spellingSuggestion = null;
          }
        });

      // Generate related searches (simplified - in production, this would come from API)
      this.relatedSearches = this.generateRelatedSearches(this.currentQuery);
    }

    // Load popular searches
    this.loadPopularSearches();
  }

  /**
   * Generate related searches (simplified)
   */
  private generateRelatedSearches(query: string): string[] {
    // In production, this would come from the search API
    const words = query.toLowerCase().split(/\s+/);
    const related: string[] = [];

    // Simple related search generation
    if (words.length > 0) {
      const firstWord = words[0];
      related.push(`${firstWord} guide`);
      related.push(`${firstWord} information`);
      if (words.length > 1) {
        related.push(words.slice(1).join(' '));
      }
    }

    return related.slice(0, 5);
  }

  /**
   * Load popular searches
   */
  private loadPopularSearches(): void {
    // In production, this would come from the search service
    this.popularSearches = [
      'Employee Handbook',
      'Benefits Information',
      'IT Support',
      'Company Policies',
      'Holiday Calendar'
    ];
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.currentQuery = '';
    this.searchResponse = null;
    this.error = null;
    this.spellingSuggestion = null;
    this.router.navigate(['/search']);
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    const queryParams = { ...this.route.snapshot.queryParams };
    delete queryParams['fileFormats'];
    delete queryParams['contentTypes'];
    delete queryParams['dateFrom'];
    delete queryParams['dateTo'];
    delete queryParams['departments'];
    delete queryParams['authors'];
    delete queryParams['sourceSystems'];

    this.router.navigate(['/search/results'], {
      queryParams: {
        q: this.currentQuery,
        page: this.currentPage,
        pageSize: this.pageSize,
        sort: this.currentSort,
        ...queryParams
      }
    });
  }

  /**
   * Check if filters are active
   */
  hasActiveFilters(): boolean {
    const params = this.route.snapshot.queryParams;
    return !!(params['fileFormats'] || params['contentTypes'] || 
              params['dateFrom'] || params['dateTo'] ||
              params['departments'] || params['authors'] ||
              params['sourceSystems']);
  }

  /**
   * Show all results (remove filters)
   */
  showAllResults(): void {
    this.clearFilters();
  }

  /**
   * Register undo/redo shortcuts
   */
  private registerUndoRedoShortcuts(): void {
    // Undo: Ctrl/Cmd + Z
    this.keyboardShortcuts.registerShortcut({
      key: 'z',
      ctrl: true,
      description: 'Undo last action',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.undo();
    });

    // Redo: Ctrl/Cmd + Shift + Z
    this.keyboardShortcuts.registerShortcut({
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo last action',
      context: 'search-results'
    }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.redo();
    });
  }

  /**
   * Save current state for undo/redo
   */
  private saveState(): void {
    const state = {
      query: this.currentQuery,
      sort: this.currentSort,
      page: this.currentPage,
      pageSize: this.pageSize,
      filters: this.route.snapshot.queryParams,
      timestamp: new Date()
    };
    this.undoRedoService.pushState(state);
  }

  /**
   * Undo last action
   */
  undo(): void {
    const state = this.undoRedoService.undo();
    if (state) {
      this.applyState(state);
    }
  }

  /**
   * Redo last action
   */
  redo(): void {
    const state = this.undoRedoService.redo();
    if (state) {
      this.applyState(state);
    }
  }

  /**
   * Apply state from undo/redo
   */
  private applyState(state: any): void {
    this.currentQuery = state.query || '';
    this.currentSort = state.sort || 'relevance';
    this.currentPage = state.page || 1;
    this.pageSize = state.pageSize || 25;

    const queryParams: any = {
      q: this.currentQuery,
      page: this.currentPage,
      pageSize: this.pageSize,
      sort: this.currentSort
    };

    // Merge filters
    if (state.filters) {
      Object.keys(state.filters).forEach(key => {
        if (key !== 'q' && key !== 'page' && key !== 'pageSize' && key !== 'sort') {
          queryParams[key] = state.filters[key];
        }
      });
    }

    this.router.navigate(['/search/results'], { queryParams });
  }
}
