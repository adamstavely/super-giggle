import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SearchResultsComponent } from './search-results.component';
import { SearchService } from '../search.service';
import { SearchResponse } from '../search.models';

describe('SearchResultsComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(() => {
    searchServiceSpy = jasmine.createSpyObj('SearchService', ['search']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    activatedRoute = {
      snapshot: { queryParams: {} },
      queryParams: of({})
    };

    TestBed.configureTestingModule({
      declarations: [SearchResultsComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    });

    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.currentQuery).toBe('');
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(25);
    expect(component.currentSort).toBe('relevance');
  });

  it('should perform search when query exists', () => {
    const mockResponse: SearchResponse = {
      results: [],
      totalCount: 0,
      searchTime: 0,
      query: 'test',
      page: 1,
      pageSize: 25,
      totalPages: 0
    };
    searchServiceSpy.search.and.returnValue(of(mockResponse));
    activatedRoute.snapshot.queryParams = { q: 'test' };

    fixture.detectChanges();

    expect(searchServiceSpy.search).toHaveBeenCalled();
  });

  it('should handle search results', (done) => {
    const mockResponse: SearchResponse = {
      results: [],
      totalCount: 10,
      searchTime: 50,
      query: 'test',
      page: 1,
      pageSize: 25,
      totalPages: 1
    };
    searchServiceSpy.search.and.returnValue(of(mockResponse));
    component.currentQuery = 'test';

    component.performSearch();

    searchServiceSpy.search().subscribe(() => {
      expect(component.loading).toBe(false);
      done();
    });
  });

  it('should toggle filters', () => {
    expect(component.showFilters).toBe(false);
    component.toggleFilters();
    expect(component.showFilters).toBe(true);
    component.toggleFilters();
    expect(component.showFilters).toBe(false);
  });

  it('should have sort options', () => {
    expect(component.sortOptions.length).toBeGreaterThan(0);
    expect(component.sortOptions[0].value).toBe('relevance');
  });

  it('should have page size options', () => {
    expect(component.pageSizeOptions).toContain(10);
    expect(component.pageSizeOptions).toContain(25);
    expect(component.pageSizeOptions).toContain(50);
  });
});
