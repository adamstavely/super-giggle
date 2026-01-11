import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResult, SearchFilters, SortOption } from '../../search/search.models';

export interface IndexedResults {
  results: SearchResult[];
  index: Map<string, Set<number>>; // term -> set of result indices
  sourceIndex: Map<string, Set<number>>; // source -> set of result indices
  authorIndex: Map<string, Set<number>>; // author -> set of result indices
  fileTypeIndex: Map<string, Set<number>>; // fileType -> set of result indices
}

@Injectable({
  providedIn: 'root'
})
export class ClientIndexService {
  private indexedResults: IndexedResults | null = null;

  constructor() {}

  /**
   * Index search results for fast client-side operations
   */
  indexResults(results: SearchResult[]): void {
    const index = new Map<string, Set<number>>();
    const sourceIndex = new Map<string, Set<number>>();
    const authorIndex = new Map<string, Set<number>>();
    const fileTypeIndex = new Map<string, Set<number>>();

    results.forEach((result, idx) => {
      // Index by searchable text (title, snippet)
      const searchableText = `${result.title} ${result.snippet}`.toLowerCase();
      const terms = this.tokenize(searchableText);

      terms.forEach(term => {
        if (!index.has(term)) {
          index.set(term, new Set());
        }
        index.get(term)!.add(idx);
      });

      // Index by source
      if (result.source) {
        const sourceKey = result.source.toLowerCase();
        if (!sourceIndex.has(sourceKey)) {
          sourceIndex.set(sourceKey, new Set());
        }
        sourceIndex.get(sourceKey)!.add(idx);
      }

      // Index by author
      if (result.author) {
        const authorKey = result.author.toLowerCase();
        if (!authorIndex.has(authorKey)) {
          authorIndex.set(authorKey, new Set());
        }
        authorIndex.get(authorKey)!.add(idx);
      }

      // Index by file type
      if (result.fileType) {
        const fileTypeKey = result.fileType.toLowerCase();
        if (!fileTypeIndex.has(fileTypeKey)) {
          fileTypeIndex.set(fileTypeKey, new Set());
        }
        fileTypeIndex.get(fileTypeKey)!.add(idx);
      }
    });

    this.indexedResults = {
      results,
      index,
      sourceIndex,
      authorIndex,
      fileTypeIndex
    };
  }

  /**
   * Filter results using index
   */
  filterResults(filters: SearchFilters): Observable<SearchResult[]> {
    if (!this.indexedResults) {
      return of([]);
    }

    let resultIndices = new Set<number>(
      Array.from({ length: this.indexedResults.results.length }, (_, i) => i)
    );

    // Filter by source systems
    if (filters.sourceSystems && filters.sourceSystems.length > 0) {
      const sourceIndices = new Set<number>();
      filters.sourceSystems.forEach(source => {
        const key = source.toLowerCase();
        const indices = this.indexedResults!.sourceIndex.get(key);
        if (indices) {
          indices.forEach(idx => sourceIndices.add(idx));
        }
      });
      resultIndices = this.intersect(resultIndices, sourceIndices);
    }

    // Filter by authors
    if (filters.authors && filters.authors.length > 0) {
      const authorIndices = new Set<number>();
      filters.authors.forEach(author => {
        const key = author.toLowerCase();
        const indices = this.indexedResults!.authorIndex.get(key);
        if (indices) {
          indices.forEach(idx => authorIndices.add(idx));
        }
      });
      resultIndices = this.intersect(resultIndices, authorIndices);
    }

    // Filter by file formats
    if (filters.fileFormats && filters.fileFormats.length > 0) {
      const fileTypeIndices = new Set<number>();
      filters.fileFormats.forEach(format => {
        const key = format.toLowerCase();
        const indices = this.indexedResults!.fileTypeIndex.get(key);
        if (indices) {
          indices.forEach(idx => fileTypeIndices.add(idx));
        }
      });
      resultIndices = this.intersect(resultIndices, fileTypeIndices);
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      const dateFilteredIndices = new Set<number>();
      resultIndices.forEach(idx => {
        const result = this.indexedResults!.results[idx];
        const lastModified = result.lastModified instanceof Date 
          ? result.lastModified 
          : new Date(result.lastModified);

        if (filters.dateFrom && lastModified < filters.dateFrom) {
          return;
        }
        if (filters.dateTo && lastModified > filters.dateTo) {
          return;
        }

        dateFilteredIndices.add(idx);
      });
      resultIndices = dateFilteredIndices;
    }

    // Convert indices to results
    const filteredResults = Array.from(resultIndices)
      .map(idx => this.indexedResults!.results[idx]);

    return of(filteredResults);
  }

  /**
   * Search within indexed results
   */
  search(query: string): Observable<SearchResult[]> {
    if (!this.indexedResults || !query.trim()) {
      return of(this.indexedResults?.results || []);
    }

    const queryTerms = this.tokenize(query.toLowerCase());
    if (queryTerms.length === 0) {
      return of(this.indexedResults.results);
    }

    // Find results matching all terms (AND logic)
    let matchingIndices: Set<number> | null = null;

    queryTerms.forEach(term => {
      const termIndices = this.indexedResults.index.get(term);
      if (termIndices) {
        if (matchingIndices === null) {
          matchingIndices = new Set(termIndices);
        } else {
          matchingIndices = this.intersect(matchingIndices, termIndices);
        }
      } else {
        // If any term doesn't match, return empty
        matchingIndices = new Set();
      }
    });

    if (matchingIndices === null || matchingIndices.size === 0) {
      return of([]);
    }

    const results = Array.from(matchingIndices)
      .map(idx => this.indexedResults!.results[idx]);

    return of(results);
  }

  /**
   * Sort results
   */
  sortResults(results: SearchResult[], sort: SortOption): SearchResult[] {
    const sorted = [...results];

    switch (sort) {
      case 'date-desc':
        sorted.sort((a, b) => {
          const dateA = new Date(a.lastModified).getTime();
          const dateB = new Date(b.lastModified).getTime();
          return dateB - dateA;
        });
        break;
      case 'date-asc':
        sorted.sort((a, b) => {
          const dateA = new Date(a.lastModified).getTime();
          const dateB = new Date(b.lastModified).getTime();
          return dateA - dateB;
        });
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'author-asc':
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'author-desc':
        sorted.sort((a, b) => b.author.localeCompare(a.author));
        break;
      // 'relevance' is default, no sorting needed
    }

    return sorted;
  }

  /**
   * Get filter counts from indexed results
   */
  getFilterCounts(filters: Partial<SearchFilters>): Observable<{
    sourceSystems: Map<string, number>;
    authors: Map<string, number>;
    fileFormats: Map<string, number>;
  }> {
    if (!this.indexedResults) {
      return of({
        sourceSystems: new Map(),
        authors: new Map(),
        fileFormats: new Map()
      });
    }

    // Apply existing filters to get base set
    const baseFilters: SearchFilters = {
      ...filters,
      sourceSystems: undefined, // Exclude what we're counting
      authors: undefined,
      fileFormats: undefined
    };

    // Get filtered results first, then count
    return this.filterResults(baseFilters).pipe(
      map(filteredResults => {
        // Count sources, authors, file types in filtered results
        const sourceCounts = new Map<string, number>();
        const authorCounts = new Map<string, number>();
        const fileFormatCounts = new Map<string, number>();

        filteredResults.forEach(result => {
          if (result.source) {
            const count = sourceCounts.get(result.source) || 0;
            sourceCounts.set(result.source, count + 1);
          }
          if (result.author) {
            const count = authorCounts.get(result.author) || 0;
            authorCounts.set(result.author, count + 1);
          }
          if (result.fileType) {
            const count = fileFormatCounts.get(result.fileType) || 0;
            fileFormatCounts.set(result.fileType, count + 1);
          }
        });

        return {
          sourceSystems: sourceCounts,
          authors: authorCounts,
          fileFormats: fileFormatCounts
        };
      })
    );
  }

  /**
   * Clear index
   */
  clearIndex(): void {
    this.indexedResults = null;
  }

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2) // Filter out short terms
      .map(term => term.replace(/[^\w]/g, '')); // Remove punctuation
  }

  /**
   * Intersect two sets
   */
  private intersect(set1: Set<number>, set2: Set<number>): Set<number> {
    const result = new Set<number>();
    set1.forEach(value => {
      if (set2.has(value)) {
        result.add(value);
      }
    });
    return result;
  }
}
