import { Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { SearchQuery, SearchResponse } from '../../search/search.models';
import { SearchService } from '../../search/search.service';

@Injectable({
  providedIn: 'root'
})
export class PrefetchService {
  private prefetchQueue: SearchQuery[] = [];
  private prefetching = false;
  private prefetchSubject = new Subject<SearchResponse>();
  private readonly prefetchThreshold = 0.8; // Prefetch when 80% through current page

  constructor(private searchService: SearchService) {}

  /**
   * Prefetch next page if user is near the end of current page
   */
  shouldPrefetch(currentPage: number, totalPages: number, scrollPosition: number, pageHeight: number): boolean {
    if (currentPage >= totalPages) {
      return false;
    }

    const scrollPercentage = scrollPosition / pageHeight;
    return scrollPercentage >= this.prefetchThreshold;
  }

  /**
   * Prefetch next page results
   */
  prefetchNextPage(query: SearchQuery): Observable<SearchResponse | null> {
    if (this.prefetching) {
      return of(null);
    }

    const nextPageQuery: SearchQuery = {
      ...query,
      page: (query.page || 1) + 1
    };

    // Check if already in queue
    if (this.isInQueue(nextPageQuery)) {
      return of(null);
    }

    this.prefetchQueue.push(nextPageQuery);
    this.processPrefetchQueue();

    return this.prefetchSubject.asObservable();
  }

  /**
   * Prefetch based on pagination (when user is on last few items)
   */
  prefetchOnPagination(query: SearchQuery, currentItemIndex: number, totalItems: number, itemsPerPage: number): void {
    const itemsRemaining = totalItems - currentItemIndex;
    const threshold = itemsPerPage * 0.2; // Prefetch when 20% of page remains

    if (itemsRemaining <= threshold && query.page) {
      this.prefetchNextPage(query);
    }
  }

  /**
   * Cancel all pending prefetches
   */
  cancelPrefetches(): void {
    this.prefetchQueue = [];
    this.prefetching = false;
  }

  /**
   * Get prefetched result for query
   */
  getPrefetched(query: SearchQuery): Observable<SearchResponse | null> {
    // This would typically check a cache or store
    // For now, return null as prefetching happens on-demand
    return of(null);
  }

  /**
   * Process prefetch queue
   */
  private processPrefetchQueue(): void {
    if (this.prefetching || this.prefetchQueue.length === 0) {
      return;
    }

    this.prefetching = true;
    const query = this.prefetchQueue.shift();

    if (!query) {
      this.prefetching = false;
      return;
    }

    this.searchService.search(query).subscribe({
      next: (response) => {
        this.prefetchSubject.next(response);
        this.prefetching = false;
        // Process next item in queue
        if (this.prefetchQueue.length > 0) {
          setTimeout(() => this.processPrefetchQueue(), 100);
        }
      },
      error: () => {
        this.prefetching = false;
        // Continue processing queue even on error
        if (this.prefetchQueue.length > 0) {
          setTimeout(() => this.processPrefetchQueue(), 100);
        }
      }
    });
  }

  /**
   * Check if query is already in prefetch queue
   */
  private isInQueue(query: SearchQuery): boolean {
    return this.prefetchQueue.some(q => 
      q.query === query.query &&
      q.page === query.page &&
      JSON.stringify(q.filters) === JSON.stringify(query.filters)
    );
  }
}
