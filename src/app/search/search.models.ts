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
