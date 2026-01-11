import { TestBed } from '@angular/core/testing';
import { UndoRedoService } from './undo-redo.service';
import { SearchState } from '../../search/search.models';

describe('UndoRedoService', () => {
  let service: UndoRedoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UndoRedoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('State Management', () => {
    it('should push and retrieve state', () => {
      const state: SearchState = {
        query: 'test',
        page: 1,
        pageSize: 25,
        timestamp: new Date()
      };

      service.pushState(state);
      const retrieved = service.undo();

      expect(retrieved).toBeNull(); // Can't undo with only one state
    });

    it('should support undo/redo', () => {
      const state1: SearchState = {
        query: 'query1',
        page: 1,
        pageSize: 25,
        timestamp: new Date()
      };

      const state2: SearchState = {
        query: 'query2',
        page: 1,
        pageSize: 25,
        timestamp: new Date()
      };

      service.pushState(state1);
      service.pushState(state2);

      expect(service.canUndo()).toBeTruthy();
      
      const undone = service.undo();
      expect(undone).toEqual(state1);

      expect(service.canRedo()).toBeTruthy();
      
      const redone = service.redo();
      expect(redone).toEqual(state2);
    });

    it('should limit history size', () => {
      for (let i = 0; i < 60; i++) {
        service.pushState({
          query: `query${i}`,
          page: 1,
          pageSize: 25,
          timestamp: new Date()
        });
      }

      // History should be limited to maxHistorySize (50)
      expect(service['history'].length).toBeLessThanOrEqual(50);
    });
  });
});
