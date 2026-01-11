import { TestBed } from '@angular/core/testing';
import { ClientIndexService } from './client-index.service';
import { SearchResult, SearchFilters } from '../../search/search.models';
import { of } from 'rxjs';

describe('ClientIndexService', () => {
  let service: ClientIndexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientIndexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Indexing', () => {
    it('should index search results', () => {
      const results: SearchResult[] = [
        {
          id: '1',
          title: 'Test Document',
          snippet: 'Test snippet',
          source: 'SharePoint',
          author: 'John Doe',
          lastModified: new Date(),
          fileType: 'PDF',
          url: '/test.pdf'
        }
      ];

      service.indexResults(results);
      expect(service['indexedResults']).not.toBeNull();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      const results: SearchResult[] = [
        {
          id: '1',
          title: 'Test Document',
          snippet: 'Test snippet',
          source: 'SharePoint',
          author: 'John Doe',
          lastModified: new Date(),
          fileType: 'PDF',
          url: '/test.pdf'
        },
        {
          id: '2',
          title: 'Another Document',
          snippet: 'Another snippet',
          source: 'OneDrive',
          author: 'Jane Smith',
          lastModified: new Date(),
          fileType: 'DOCX',
          url: '/test.docx'
        }
      ];

      service.indexResults(results);
    });

    it('should filter by source', (done) => {
      const filters: SearchFilters = {
        sourceSystems: ['SharePoint']
      };

      service.filterResults(filters).subscribe(filtered => {
        expect(filtered.length).toBe(1);
        expect(filtered[0].source).toBe('SharePoint');
        done();
      });
    });

    it('should filter by author', (done) => {
      const filters: SearchFilters = {
        authors: ['John Doe']
      };

      service.filterResults(filters).subscribe(filtered => {
        expect(filtered.length).toBe(1);
        expect(filtered[0].author).toBe('John Doe');
        done();
      });
    });

    it('should filter by file format', (done) => {
      const filters: SearchFilters = {
        fileFormats: ['PDF']
      };

      service.filterResults(filters).subscribe(filtered => {
        expect(filtered.length).toBe(1);
        expect(filtered[0].fileType).toBe('PDF');
        done();
      });
    });

    it('should return empty array when no index exists', (done) => {
      const newService = new ClientIndexService();
      const filters: SearchFilters = {
        sourceSystems: ['SharePoint']
      };

      newService.filterResults(filters).subscribe(filtered => {
        expect(filtered).toEqual([]);
        done();
      });
    });
  });
});
