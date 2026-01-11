import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SearchHomeComponent } from './search-home.component';
import { SearchService } from '../search.service';

describe('SearchHomeComponent', () => {
  let component: SearchHomeComponent;
  let fixture: ComponentFixture<SearchHomeComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    searchServiceSpy = jasmine.createSpyObj('SearchService', ['getTrendingSearches']);

    TestBed.configureTestingModule({
      declarations: [SearchHomeComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SearchService, useValue: searchServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(SearchHomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load trending searches on init', () => {
    const mockTrending = ['Search 1', 'Search 2'];
    searchServiceSpy.getTrendingSearches.and.returnValue(of(mockTrending));

    fixture.detectChanges();

    expect(searchServiceSpy.getTrendingSearches).toHaveBeenCalled();
    expect(component.trendingSearches).toEqual(mockTrending);
  });

  it('should handle error when loading trending searches', () => {
    searchServiceSpy.getTrendingSearches.and.returnValue(throwError(() => new Error('Test error')));

    fixture.detectChanges();

    expect(component.trendingSearches).toEqual([]);
  });

  it('should navigate to results on search', () => {
    const query = 'test query';
    component.onSearch(query);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/search/results'],
      jasmine.objectContaining({
        queryParams: { q: query }
      })
    );
  });

  it('should not navigate with empty query', () => {
    component.onSearch('');
    component.onSearch('   ');

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should have quick links', () => {
    expect(component.quickLinks.length).toBeGreaterThan(0);
    expect(component.quickLinks[0].label).toBeDefined();
    expect(component.quickLinks[0].url).toBeDefined();
    expect(component.quickLinks[0].icon).toBeDefined();
  });
});
