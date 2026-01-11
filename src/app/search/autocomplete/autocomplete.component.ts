import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AutocompleteSuggestion } from '../search.models';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent {
  @Input() suggestions: AutocompleteSuggestion[] = [];
  @Input() query: string = '';
  @Output() suggestionSelected = new EventEmitter<AutocompleteSuggestion>();

  onSuggestionClick(suggestion: AutocompleteSuggestion): void {
    this.suggestionSelected.emit(suggestion);
  }
}
