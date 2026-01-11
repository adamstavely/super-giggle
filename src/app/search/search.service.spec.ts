import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SearchService } from './search.service';
import { SearchQuery, SearchResponse, SearchHistory } from './search.models';

describe('SearchService', () => {
  let service: SearchService;
  let localStorageSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchService]
    });
    service = TestBed.inject(SearchService);

    // Mock localStorage
    localStorageSpy = spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('search', () => {
    it('should return mock search results', (done) => {
      const query: SearchQuery = {
        query: 'test',
        page: 1,
        pageSize: 25
      };

      service.search(query).subscribe((response: SearchResponse) => {
        expect(response).toBeDefined();
        expect(response.results).toBeDefined();
        expect(response.query).toBe('test');
        expect(response.page).toBe(1);
        expect(response.pageSize).toBe(25);
        done();
      });
    });

    it('should filter results based on query', (done) => {
      const query: SearchQuery = {
        query: 'employee',
        page: 1,
        pageSize: 25
      };

      service.search(query).subscribe((response: SearchResponse) => {
        expect(response.results.length).toBeGreaterThan(0);
        // Results should contain the query term
        const hasMatchingResult = response.results.some(
          result =>
            result.title.toLowerCase().includes('employee') ||
            result.snippet.toLowerCase().includes('employee')
        );
        expect(hasMatchingResult).toBe(true);
        done();
      });
    });

    it('should handle pagination', (done) => {
      const query: SearchQuery = {
        query: 'test',
        page: 2,
        pageSize: 10
      };

      service.search(query).subscribe((response: SearchResponse) => {
        expect(response.page).toBe(2);
        expect(response.pageSize).toBe(10);
        done();
      });
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should return empty array for queries shorter than 3 characters', (done) => {
      service.getAutocompleteSuggestions('ab').subscribe((suggestions) => {
        expect(suggestions).toEqual([]);
        done();
      });
    });

    it('should return suggestions for valid queries', (done) => {
      service.getAutocompleteSuggestions('employee').subscribe((suggestions) => {
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].text).toBeDefined();
        expect(suggestions[0].type).toBeDefined();
        done();
      });
    });

    it('should filter suggestions based on query', (done) => {
      service.getAutocompleteSuggestions('benefits').subscribe((suggestions) => {
        const hasMatchingSuggestion = suggestions.some(s => 
          s.text.toLowerCase().includes('benefits')
        );
        expect(hasMatchingSuggestion).toBe(true);
        done();
      });
    });
  });

  describe('getTrendingSearches', () => {
    it('should return trending searches', (done) => {
      service.getTrendingSearches().subscribe((trending) => {
        expect(trending).toBeDefined();
        expect(Array.isArray(trending)).toBe(true);
        expect(trending.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('getSearchHistory', () => {
    it('should return empty array when no history exists', (done) => {
      localStorageSpy.and.returnValue(null);
      service.getSearchHistory().subscribe((history) => {
        expect(history).toEqual([]);
        done();
      });
    });

    it('should return search history from localStorage', (done) => {
      const mockHistory: SearchHistory[] = [
        { query: 'test1', timestamp: new Date() },
        { query: 'test2', timestamp: new Date() }
      ];
      localStorageSpy.and.returnValue(JSON.stringify(mockHistory));

      service.getSearchHistory().subscribe((history) => {
        expect(history.length).toBe(2);
        expect(history[0].query).toBe('test1');
        done();
      });
    });

    it('should handle invalid JSON in localStorage', (done) => {
      localStorageSpy.and.returnValue('invalid json');
      service.getSearchHistory().subscribe((history) => {
        expect(history).toEqual([]);
        done();
      });
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search query to history', () => {
      localStorageSpy.and.returnValue(null);
      service.saveSearchHistory('test query');

      expect(localStorage.setItem).toHaveBeenCalled();
      const callArgs = (localStorage.setItem as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[0]).toBe('intranet_search_history');
      const savedHistory = JSON.parse(callArgs[1]);
      expect(savedHistory[0].query).toBe('test query');
    });

    it('should not save empty queries', () => {
      service.saveSearchHistory('');
      service.saveSearchHistory('   ');

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should remove duplicates and keep most recent', () => {
      const existingHistory: SearchHistory[] = [
        { query: 'test', timestamp: new Date('2024-01-01') }
      ];
      localStorageSpy.and.returnValue(JSON.stringify(existingHistory));

      service.saveSearchHistory('test');

      const callArgs = (localStorage.setItem as jasmine.Spy).calls.mostRecent().args;
      const savedHistory = JSON.parse(callArgs[1]);
      expect(savedHistory.length).toBe(1);
      expect(savedHistory[0].query).toBe('test');
    });

    it('should limit history to max items', () => {
      const manyItems: SearchHistory[] = Array.from({ length: 25 }, (_, i) => ({
        query: `query${i}`,
        timestamp: new Date()
      }));
      localStorageSpy.and.returnValue(JSON.stringify(manyItems));

      service.saveSearchHistory('new query');

      const callArgs = (localStorage.setItem as jasmine.Spy).calls.mostRecent().args;
      const savedHistory = JSON.parse(callArgs[1]);
      expect(savedHistory.length).toBeLessThanOrEqual(20);
    });
  });

  describe('clearSearchHistory', () => {
    it('should remove search history from localStorage', () => {
      service.clearSearchHistory();
      expect(localStorage.removeItem).toHaveBeenCalledWith('intranet_search_history');
    });
  });
});
