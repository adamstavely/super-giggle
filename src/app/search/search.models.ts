export type ContentType = 'all' | 'news' | 'video' | 'images' | 'sites';

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: string;
  author: string;
  lastModified: Date | string;
  fileType: string;
  url: string;
  thumbnail?: string;
  breadcrumb?: string[];
  highlightedTerms?: string[];
  contentType?: ContentType;
}

export interface SearchResponse {
  results: SearchResult[];
  featuredResults?: SearchResult[];
  totalCount: number;
  searchTime: number;
  query: string;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOptions {
  contentTypes: FilterOption[];
  departments: FilterOption[];
  authors: FilterOption[];
  fileFormats: FilterOption[];
  sourceSystems: FilterOption[];
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SearchFilters {
  contentTypes?: string[];
  departments?: string[];
  authors?: string[];
  fileFormats?: string[];
  sourceSystems?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export type SortOption = 'relevance' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'author-asc' | 'author-desc';

export interface AutocompleteSuggestion {
  text: string;
  type: 'query' | 'document' | 'person' | 'department';
  count?: number;
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

// AI Answer Models
export interface AIAnswer {
  answer: string;
  confidence: number;
  sources: string[];
  query: string;
}

// Query Processing Models
export interface SpellCorrection {
  original: string;
  corrected: string;
  suggestions: string[];
  confidence: number;
}

export interface QueryExpansion {
  original: string;
  expanded: string;
  addedTerms: string[];
  removedTerms: string[];
}

export type SearchIntent = 'question' | 'person_search' | 'factual_query' | 'navigational' | 'exploratory';

// Saved Search Templates
export interface SavedSearchTemplate {
  id: string;
  name: string;
  description?: string;
  query: SearchQuery;
  created: Date;
  lastUsed?: Date;
  isPublic?: boolean;
  category?: string;
}

// Document Metadata
export interface DocumentMetadata {
  fileSize?: number;
  wordCount?: number;
  readingTime?: number; // in minutes
  pageCount?: number;
  language?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

// Shareable Search Links
export interface ShareableSearchLink {
  url: string;
  query: string;
  filters?: SearchFilters;
  expiresAt?: Date;
  createdAt: Date;
}

// Search State (for undo/redo)
export interface SearchState {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  page: number;
  pageSize: number;
  timestamp: Date;
}

// Cache Entry
export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}
