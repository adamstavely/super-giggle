import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { SearchService } from '../search.service';
import { QueryProcessingService } from '../../core/services/query-processing.service';
import { AutocompleteSuggestion, SearchHistory, SpellCorrection, QueryExpansion } from '../search.models';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() initialQuery: string = '';
  @Input() showHistory: boolean = true;
  @Input() showAdvancedLink: boolean = true;
  @Input() placeholder: string = 'Search the intranet...';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() search = new EventEmitter<string>();
  @Output() queryChange = new EventEmitter<string>();

  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');
  showAutocomplete = false;
  showHistoryDropdown = false;
  autocompleteSuggestions: AutocompleteSuggestion[] = [];
  searchHistory: SearchHistory[] = [];
  selectedSuggestionIndex = -1;
  
  // Spell correction
  spellCorrection: SpellCorrection | null = null;
  showSpellCorrection = false;
  
  // Query expansion
  queryExpansion: QueryExpansion | null = null;
  useExpandedQuery = false;
  showExpansionToggle = false;
  
  private querySubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private searchService: SearchService,
    private queryProcessingService: QueryProcessingService
  ) {}

  ngOnInit(): void {
    if (this.initialQuery) {
      this.searchControl.setValue(this.initialQuery);
    }

    // Subscribe to query changes for autocomplete, spell correction, and query expansion
    this.querySubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query && query.length >= 3) {
        this.loadAutocompleteSuggestions(query);
        this.checkSpelling(query);
        this.checkQueryExpansion(query);
      } else {
        this.autocompleteSuggestions = [];
        this.showAutocomplete = false;
        this.spellCorrection = null;
        this.showSpellCorrection = false;
        this.queryExpansion = null;
        this.showExpansionToggle = false;
      }
    });

    // Load search history
    if (this.showHistory) {
      this.loadSearchHistory();
    }

    // Emit query changes
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const query = value || '';
        this.queryChange.emit(query);
        this.querySubject.next(query);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSearchHistory(): void {
    this.searchService.getSearchHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        history => {
          this.searchHistory = history;
        }
      );
  }

  onInputFocus(): void {
    if (this.searchControl.value && this.searchControl.value.length >= 3) {
      this.showAutocomplete = true;
    }
    if (this.showHistory && this.searchHistory.length > 0 && !this.searchControl.value) {
      this.showHistoryDropdown = true;
    }
  }

  onInputBlur(): void {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      this.showAutocomplete = false;
      this.showHistoryDropdown = false;
    }, 200);
  }

  onInputKeyDown(event: KeyboardEvent): void {
    if (this.showAutocomplete && this.autocompleteSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.autocompleteSuggestions.length - 1
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0) {
          this.selectSuggestion(this.autocompleteSuggestions[this.selectedSuggestionIndex]);
        } else {
          this.performSearch();
        }
      } else if (event.key === 'Escape') {
        this.showAutocomplete = false;
        this.selectedSuggestionIndex = -1;
      }
    } else if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  performSearch(): void {
    let query = this.searchControl.value?.trim() || '';
    
    // Use expanded query if enabled
    if (this.useExpandedQuery && this.queryExpansion) {
      query = this.queryExpansion.expanded;
    }
    
    // Use corrected query if spell correction is available and user hasn't manually edited
    if (this.spellCorrection && this.showSpellCorrection && query === this.spellCorrection.original) {
      query = this.spellCorrection.corrected;
    }
    
    if (query) {
      this.searchService.saveSearchHistory(query);
      this.search.emit(query);
      this.showAutocomplete = false;
      this.showHistoryDropdown = false;
      this.showSpellCorrection = false;
      this.showExpansionToggle = false;
    }
  }

  selectSuggestion(suggestion: AutocompleteSuggestion): void {
    this.searchControl.setValue(suggestion.text);
    this.performSearch();
  }

  selectHistoryItem(historyItem: SearchHistory): void {
    this.searchControl.setValue(historyItem.query);
    this.performSearch();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.autocompleteSuggestions = [];
    this.showAutocomplete = false;
    this.showHistoryDropdown = false;
    this.searchInput.nativeElement.focus();
  }

  clearHistory(): void {
    this.searchService.clearSearchHistory();
    this.loadSearchHistory();
  }

  private loadAutocompleteSuggestions(query: string): void {
    this.searchService.getAutocompleteSuggestions(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        suggestions => {
          this.autocompleteSuggestions = suggestions;
          this.showAutocomplete = suggestions.length > 0;
          this.selectedSuggestionIndex = -1;
        }
      );
  }


  getSizeClass(): string {
    return `search-bar-${this.size}`;
  }

  getSuggestionIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'query': 'search',
      'document': 'description',
      'person': 'person',
      'department': 'business'
    };
    return iconMap[type] || 'search';
  }

  highlightText(text: string, query: string): string {
    if (!query || !text) {
      return text;
    }
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  /**
   * Check spelling and show corrections
   */
  private checkSpelling(query: string): void {
    this.queryProcessingService.checkSpelling(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe(correction => {
        this.spellCorrection = correction;
        this.showSpellCorrection = !!correction && correction.confidence > 0.7;
      });
  }

  /**
   * Check if query can be expanded
   */
  private checkQueryExpansion(query: string): void {
    this.queryProcessingService.expandQuery(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe(expansion => {
        this.queryExpansion = expansion;
        // Show expansion toggle if there are added terms
        this.showExpansionToggle = expansion.addedTerms.length > 0;
      });
  }

  /**
   * Apply spell correction
   */
  applySpellCorrection(): void {
    if (this.spellCorrection) {
      this.searchControl.setValue(this.spellCorrection.corrected);
      this.showSpellCorrection = false;
      // Trigger search automatically after correction
      setTimeout(() => this.performSearch(), 100);
    }
  }

  /**
   * Dismiss spell correction
   */
  dismissSpellCorrection(): void {
    this.showSpellCorrection = false;
  }

  /**
   * Toggle query expansion
   */
  toggleQueryExpansion(): void {
    this.useExpandedQuery = !this.useExpandedQuery;
  }

  /**
   * Get misspelled words from query
   */
  getMisspelledWords(): string[] {
    if (!this.spellCorrection || !this.searchControl.value) {
      return [];
    }
    
    const originalWords = this.spellCorrection.original.split(/\s+/);
    const correctedWords = this.spellCorrection.corrected.split(/\s+/);
    const misspelled: string[] = [];
    
    originalWords.forEach((word, index) => {
      if (correctedWords[index] && word.toLowerCase() !== correctedWords[index].toLowerCase()) {
        misspelled.push(word);
      }
    });
    
    return misspelled;
  }

  /**
   * Check if a word is misspelled
   */
  isMisspelled(word: string): boolean {
    return this.getMisspelledWords().includes(word);
  }
}
