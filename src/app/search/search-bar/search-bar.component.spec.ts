import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { SearchBarComponent } from './search-bar.component';
import { SearchService } from '../search.service';
import { AutocompleteSuggestion, SearchHistory } from '../search.models';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;

  beforeEach(() => {
    searchServiceSpy = jasmine.createSpyObj('SearchService', [
      'getAutocompleteSuggestions',
      'getSearchHistory',
      'saveSearchHistory',
      'clearSearchHistory'
    ]);

    TestBed.configureTestingModule({
      declarations: [SearchBarComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with initial query', () => {
    component.initialQuery = 'test query';
    fixture.detectChanges();

    expect(component.searchControl.value).toBe('test query');
  });

  it('should load search history when showHistory is true', () => {
    const mockHistory: SearchHistory[] = [
      { query: 'test1', timestamp: new Date() }
    ];
    searchServiceSpy.getSearchHistory.and.returnValue(of(mockHistory));
    component.showHistory = true;

    fixture.detectChanges();

    expect(searchServiceSpy.getSearchHistory).toHaveBeenCalled();
  });

  it('should not load history when showHistory is false', () => {
    component.showHistory = false;
    fixture.detectChanges();

    expect(searchServiceSpy.getSearchHistory).not.toHaveBeenCalled();
  });

  it('should emit search event on performSearch', () => {
    spyOn(component.search, 'emit');
    component.searchControl.setValue('test query');

    component.performSearch();

    expect(component.search.emit).toHaveBeenCalledWith('test query');
    expect(searchServiceSpy.saveSearchHistory).toHaveBeenCalledWith('test query');
  });

  it('should not emit search with empty query', () => {
    spyOn(component.search, 'emit');
    component.searchControl.setValue('');

    component.performSearch();

    expect(component.search.emit).not.toHaveBeenCalled();
  });

  it('should load autocomplete suggestions for queries >= 3 characters', (done) => {
    const mockSuggestions: AutocompleteSuggestion[] = [
      { text: 'test suggestion', type: 'query' }
    ];
    searchServiceSpy.getAutocompleteSuggestions.and.returnValue(of(mockSuggestions));

    component.searchControl.setValue('test');
    fixture.detectChanges();

    setTimeout(() => {
      expect(searchServiceSpy.getAutocompleteSuggestions).toHaveBeenCalledWith('test');
      expect(component.autocompleteSuggestions).toEqual(mockSuggestions);
      done();
    }, 250);
  });

  it('should not load autocomplete for queries < 3 characters', () => {
    component.searchControl.setValue('ab');
    fixture.detectChanges();

    expect(searchServiceSpy.getAutocompleteSuggestions).not.toHaveBeenCalled();
  });

  it('should select suggestion and perform search', () => {
    spyOn(component, 'performSearch');
    const suggestion: AutocompleteSuggestion = { text: 'selected', type: 'query' };

    component.selectSuggestion(suggestion);

    expect(component.searchControl.value).toBe('selected');
    expect(component.performSearch).toHaveBeenCalled();
  });

  it('should clear search', () => {
    component.searchControl.setValue('test');
    component.autocompleteSuggestions = [{ text: 'test', type: 'query' }];
    component.showAutocomplete = true;

    component.clearSearch();

    expect(component.searchControl.value).toBe('');
    expect(component.autocompleteSuggestions).toEqual([]);
    expect(component.showAutocomplete).toBe(false);
  });

  it('should clear history', () => {
    component.clearHistory();

    expect(searchServiceSpy.clearSearchHistory).toHaveBeenCalled();
    expect(searchServiceSpy.getSearchHistory).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    component.autocompleteSuggestions = [
      { text: 'suggestion1', type: 'query' },
      { text: 'suggestion2', type: 'query' }
    ];
    component.showAutocomplete = true;

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onInputKeyDown(arrowDownEvent);

    expect(component.selectedSuggestionIndex).toBe(0);

    const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.onInputKeyDown(arrowUpEvent);

    expect(component.selectedSuggestionIndex).toBe(-1);
  });

  it('should get size class', () => {
    component.size = 'large';
    expect(component.getSizeClass()).toBe('search-bar-large');
  });

  it('should get suggestion icon', () => {
    expect(component.getSuggestionIcon('query')).toBe('search');
    expect(component.getSuggestionIcon('document')).toBe('description');
    expect(component.getSuggestionIcon('person')).toBe('person');
    expect(component.getSuggestionIcon('department')).toBe('business');
    expect(component.getSuggestionIcon('unknown')).toBe('search');
  });
});
