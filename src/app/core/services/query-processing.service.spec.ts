import { TestBed } from '@angular/core/testing';
import { QueryProcessingService } from './query-processing.service';
import { of } from 'rxjs';

describe('QueryProcessingService', () => {
  let service: QueryProcessingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryProcessingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Spell Correction', () => {
    it('should detect misspellings', (done) => {
      service.checkSpelling('benifits').subscribe(result => {
        expect(result).not.toBeNull();
        expect(result?.corrected).toContain('benefits');
        done();
      });
    });

    it('should return null for correct spelling', (done) => {
      service.checkSpelling('benefits').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('Query Expansion', () => {
    it('should expand queries with synonyms', (done) => {
      service.expandQuery('employee').subscribe(result => {
        expect(result).not.toBeNull();
        expect(result.expanded).toBeTruthy();
        done();
      });
    });
  });

  describe('Advanced Operators', () => {
    it('should parse proximity operators', () => {
      const result = service.parseAdvancedOperators('"term1 term2"~5');
      expect(result.proximity).toBeDefined();
      expect(result.proximity?.distance).toBe(5);
    });

    it('should parse wildcards', () => {
      const result = service.parseAdvancedOperators('test*');
      expect(result.wildcards.length).toBeGreaterThan(0);
    });

    it('should parse field boosts', () => {
      const result = service.parseAdvancedOperators('title:term^2');
      expect(result.fieldBoosts.length).toBeGreaterThan(0);
    });

    it('should validate operators', () => {
      const result = service.validateAdvancedQuery('title:term^2');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Intent Detection', () => {
    it('should detect question intent', () => {
      const intent = service.detectIntent('what is employee benefits?');
      expect(intent).toBe('question');
    });

    it('should detect person search intent', () => {
      const intent = service.detectIntent('find contact for john doe');
      expect(intent).toBe('person_search');
    });
  });
});
