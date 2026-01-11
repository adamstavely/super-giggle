import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-search-home',
  templateUrl: './search-home.component.html',
  styleUrls: ['./search-home.component.scss']
})
export class SearchHomeComponent implements OnInit {
  showAdvancedSearch = false;
  trendingSearches: string[] = [];
  quickLinks: { label: string; url: string; icon: string }[] = [
    { label: 'Employee Directory', url: '/directory', icon: 'people' },
    { label: 'Company Policies', url: '/policies', icon: 'description' },
    { label: 'Benefits Information', url: '/benefits', icon: 'favorite' },
    { label: 'IT Help Desk', url: '/helpdesk', icon: 'help' }
  ];

  constructor(
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.loadTrendingSearches();
  }

  onSearch(query: string): void {
    if (query && query.trim()) {
      const trimmedQuery = query.trim();
      this.router.navigate(['/search/results'], {
        queryParams: { q: trimmedQuery },
        replaceUrl: false // Allow history for initial search
      });
    }
  }

  openAdvancedSearch(): void {
    this.showAdvancedSearch = true;
  }

  closeAdvancedSearch(): void {
    this.showAdvancedSearch = false;
  }

  onAdvancedSearch(event: { query: string; filters: any }): void {
    const queryParams: any = { q: event.query };
    
    if (event.filters.fileFormats && event.filters.fileFormats.length > 0) {
      queryParams.fileFormats = event.filters.fileFormats.join(',');
    }
    
    if (event.filters.contentTypes && event.filters.contentTypes.length > 0) {
      queryParams.contentTypes = event.filters.contentTypes.join(',');
    }
    
    if (event.filters.dateFrom) {
      queryParams.dateFrom = event.filters.dateFrom.toISOString();
    }
    
    if (event.filters.dateTo) {
      queryParams.dateTo = event.filters.dateTo.toISOString();
    }
    
    this.router.navigate(['/search/results'], { queryParams });
  }

  navigateToLink(url: string): void {
    // In a real app, this would navigate to the actual link
    // For now, just log it
    console.log('Navigate to:', url);
  }

  private loadTrendingSearches(): void {
    this.searchService.getTrendingSearches().subscribe(
      searches => {
        this.trendingSearches = searches;
      },
      error => {
        console.error('Error loading trending searches:', error);
        // Fallback to empty array
        this.trendingSearches = [];
      }
    );
  }
}
