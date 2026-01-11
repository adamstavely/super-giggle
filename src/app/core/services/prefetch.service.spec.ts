import { TestBed } from '@angular/core/testing';
import { PrefetchService } from './prefetch.service';
import { SearchService } from '../../search/search.service';
import { SearchQuery } from '../../search/search.models';
import { of } from 'rxjs';

describe('PrefetchService', () => {
  let service: PrefetchService;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SearchService', ['search']);

    TestBed.configureTestingModule({
      providers: [
        PrefetchService,
        { provide: SearchService, useValue: spy }
      ]
    });
    service = TestBed.inject(PrefetchService);
    searchServiceSpy = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Prefetch Logic', () => {
    it('should determine if prefetch should occur', () => {
      expect(service.shouldPrefetch(1, 5, 800, 1000)).toBe(true);
      expect(service.shouldPrefetch(5, 5, 800, 1000)).toBe(false); // Last page
      expect(service.shouldPrefetch(1, 5, 100, 1000)).toBe(false); // Not near bottom
    });

    it('should prefetch next page', (done) => {
      const query: SearchQuery = {
        query: 'test',
        page: 1,
        pageSize: 25
      };

      const mockResponse = {
        results: [],
        totalCount: 50,
        searchTime: 100,
        query: 'test',
        page: 2,
        pageSize: 25,
        totalPages: 2
      };

      searchServiceSpy.search.and.returnValue(of(mockResponse));

      service.prefetchNextPage(query).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(searchServiceSpy.search).toHaveBeenCalledWith({
          ...query,
          page: 2
        });
        done();
      });
    });
  });
});
