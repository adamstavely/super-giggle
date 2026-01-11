import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutocompleteComponent } from './autocomplete.component';
import { AutocompleteSuggestion } from '../search.models';

describe('AutocompleteComponent', () => {
  let component: AutocompleteComponent;
  let fixture: ComponentFixture<AutocompleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AutocompleteComponent]
    });

    fixture = TestBed.createComponent(AutocompleteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit suggestion when clicked', () => {
    spyOn(component.suggestionSelected, 'emit');
    const suggestion: AutocompleteSuggestion = { text: 'test', type: 'query' };

    component.onSuggestionClick(suggestion);

    expect(component.suggestionSelected.emit).toHaveBeenCalledWith(suggestion);
  });

  it('should accept suggestions input', () => {
    const suggestions: AutocompleteSuggestion[] = [
      { text: 'test1', type: 'query' },
      { text: 'test2', type: 'document' }
    ];
    component.suggestions = suggestions;

    expect(component.suggestions).toEqual(suggestions);
  });

  it('should accept query input', () => {
    component.query = 'test query';
    expect(component.query).toBe('test query');
  });
});
