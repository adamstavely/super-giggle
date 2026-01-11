import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { SearchState } from '../../search/search.models';

@Injectable({
  providedIn: 'root'
})
export class UndoRedoService {
  private readonly maxHistorySize = 50;
  private history: SearchState[] = [];
  private currentIndex = -1;
  private stateSubject = new BehaviorSubject<SearchState | null>(null);
  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  /**
   * Get current state observable
   */
  getCurrentState(): Observable<SearchState | null> {
    return this.stateSubject.asObservable();
  }

  /**
   * Get can undo observable
   */
  canUndo(): Observable<boolean> {
    return this.canUndoSubject.asObservable();
  }

  /**
   * Get can redo observable
   */
  canRedo(): Observable<boolean> {
    return this.canRedoSubject.asObservable();
  }

  /**
   * Add new state to history
   */
  pushState(state: SearchState): void {
    // Remove any states after current index (when undoing and then making new change)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.history.push(this.serializeState(state));
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    this.updateState();
  }

  /**
   * Undo to previous state
   */
  undo(): SearchState | null {
    if (!this.canUndoValue()) {
      return null;
    }

    this.currentIndex--;
    const state = this.history[this.currentIndex];
    this.updateState();
    return state ? this.deserializeState(state) : null;
  }

  /**
   * Redo to next state
   */
  redo(): SearchState | null {
    if (!this.canRedoValue()) {
      return null;
    }

    this.currentIndex++;
    const state = this.history[this.currentIndex];
    this.updateState();
    return state ? this.deserializeState(state) : null;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.updateState();
  }

  /**
   * Get current state
   */
  getCurrentStateValue(): SearchState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }

    const state = this.history[this.currentIndex];
    return state ? this.deserializeState(state) : null;
  }

  /**
   * Check if undo is possible
   */
  canUndoValue(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedoValue(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Update state and notify observers
   */
  private updateState(): void {
    const currentState = this.getCurrentStateValue();
    this.stateSubject.next(currentState);
    this.canUndoSubject.next(this.canUndoValue());
    this.canRedoSubject.next(this.canRedoValue());
  }

  /**
   * Serialize state for storage
   */
  private serializeState(state: SearchState): SearchState {
    return {
      ...state,
      timestamp: state.timestamp || new Date(),
      filters: state.filters ? this.serializeFilters(state.filters) : undefined
    };
  }

  /**
   * Deserialize state from storage
   */
  private deserializeState(state: SearchState): SearchState {
    return {
      ...state,
      timestamp: state.timestamp instanceof Date ? state.timestamp : new Date(state.timestamp),
      filters: state.filters ? this.deserializeFilters(state.filters) : undefined
    };
  }

  /**
   * Serialize filters (handle Date objects)
   */
  private serializeFilters(filters: any): any {
    const serialized = { ...filters };
    
    if (serialized.dateFrom instanceof Date) {
      serialized.dateFrom = serialized.dateFrom.toISOString();
    }
    if (serialized.dateTo instanceof Date) {
      serialized.dateTo = serialized.dateTo.toISOString();
    }

    return serialized;
  }

  /**
   * Deserialize filters (restore Date objects)
   */
  private deserializeFilters(filters: any): any {
    const deserialized = { ...filters };
    
    if (deserialized.dateFrom) {
      deserialized.dateFrom = new Date(deserialized.dateFrom);
    }
    if (deserialized.dateTo) {
      deserialized.dateTo = new Date(deserialized.dateTo);
    }

    return deserialized;
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.history.length;
  }
}
