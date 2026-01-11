import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';
import { SearchResponse, SearchQuery } from '../../search/search.models';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Cache Operations', () => {
    it('should set and get cached data', (done) => {
      const testData: SearchResponse = {
        results: [],
        totalCount: 0,
        searchTime: 100,
        query: 'test',
        page: 1,
        pageSize: 25,
        totalPages: 1
      };

      const cacheKey = 'test-key';
      service.set(cacheKey, testData);

      service.get<SearchResponse>(cacheKey).subscribe(data => {
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should return null for non-existent keys', (done) => {
      service.get<SearchResponse>('non-existent').subscribe(data => {
        expect(data).toBeNull();
        done();
      });
    });

    it('should clear cache', (done) => {
      const testData: SearchResponse = {
        results: [],
        totalCount: 0,
        searchTime: 100,
        query: 'test',
        page: 1,
        pageSize: 25,
        totalPages: 1
      };

      service.set('test-key', testData);
      service.clear();

      service.get<SearchResponse>('test-key').subscribe(data => {
        expect(data).toBeNull();
        done();
      });
    });

    it('should generate consistent cache keys', () => {
      const query: SearchQuery = {
        query: 'test query',
        page: 1,
        pageSize: 25,
        sort: 'relevance'
      };

      const key1 = service.generateSearchKey(
        query.query,
        query.filters,
        query.sort,
        query.page,
        query.pageSize
      );

      const key2 = service.generateSearchKey(
        query.query,
        query.filters,
        query.sort,
        query.page,
        query.pageSize
      );

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different queries', () => {
      const key1 = service.generateSearchKey('query1', undefined, 'relevance', 1, 25);
      const key2 = service.generateSearchKey('query2', undefined, 'relevance', 1, 25);

      expect(key1).not.toBe(key2);
    });
  });
});
