import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QueryProcessingService } from '../../core/services/query-processing.service';

export interface SearchTip {
  id: string;
  title: string;
  description: string;
  category: 'operator' | 'query' | 'general';
  icon?: string;
}

@Component({
  selector: 'app-search-tips',
  templateUrl: './search-tips.component.html',
  styleUrls: ['./search-tips.component.scss']
})
export class SearchTipsComponent implements OnInit, OnDestroy {
  @Input() query: string = '';
  @Input() showTips: boolean = true;
  @Input() dismissible: boolean = true;

  tips: SearchTip[] = [];
  dismissedTips: Set<string> = new Set();
  private destroy$ = new Subject<void>();

  constructor(private queryProcessing: QueryProcessingService) {}

  ngOnInit(): void {
    this.loadDismissedTips();
    this.generateTips();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Generate contextual tips based on query
   */
  private generateTips(): void {
    this.tips = [];

    if (!this.query || !this.query.trim()) {
      // General tips when no query
      this.tips = this.getGeneralTips();
      return;
    }

    const queryLower = this.query.toLowerCase().trim();

    // Check for advanced operators
    const operators = this.queryProcessing.parseAdvancedOperators(this.query);
    if (operators.proximity || operators.wildcards.length > 0 || operators.regex || operators.fieldBoosts.length > 0) {
      this.tips.push({
        id: 'advanced-operators',
        title: 'Advanced Operators Detected',
        description: 'You\'re using advanced search operators. Use ? to see all available operators.',
        category: 'operator',
        icon: 'code'
      });
    }

    // Check for question-like queries
    if (queryLower.includes('?') || queryLower.startsWith('what') || queryLower.startsWith('how') || 
        queryLower.startsWith('when') || queryLower.startsWith('where') || queryLower.startsWith('why')) {
      this.tips.push({
        id: 'question-query',
        title: 'Question Detected',
        description: 'Try using natural language or check the AI Answer section for direct answers.',
        category: 'query',
        icon: 'help_outline'
      });
    }

    // Check for short queries
    if (this.query.trim().split(/\s+/).length <= 2 && this.query.trim().length < 10) {
      this.tips.push({
        id: 'short-query',
        title: 'Try More Specific Terms',
        description: 'Adding more keywords can help narrow down your search results.',
        category: 'query',
        icon: 'search'
      });
    }

    // Check for common misspellings
    this.queryProcessing.checkSpelling(this.query)
      .pipe(takeUntil(this.destroy$))
      .subscribe(spellCheck => {
        if (spellCheck && spellCheck.suggestions.length > 0) {
          this.tips.push({
            id: 'spelling-suggestion',
            title: 'Spelling Suggestion',
            description: `Did you mean "${spellCheck.suggestions[0]}"?`,
            category: 'query',
            icon: 'spellcheck'
          });
        }
      });

    // Add general tips if no specific tips
    if (this.tips.length === 0) {
      this.tips = this.getGeneralTips().slice(0, 2);
    }
  }

  /**
   * Get general search tips
   */
  private getGeneralTips(): SearchTip[] {
    return [
      {
        id: 'use-quotes',
        title: 'Use Quotes for Exact Phrases',
        description: 'Wrap phrases in quotes to search for exact matches: "employee handbook"',
        category: 'operator',
        icon: 'format_quote'
      },
      {
        id: 'use-wildcards',
        title: 'Use Wildcards',
        description: 'Use * for multiple characters or ? for single character: test* or te?t',
        category: 'operator',
        icon: 'star'
      },
      {
        id: 'field-search',
        title: 'Search Specific Fields',
        description: 'Use field:term to search in specific fields: title:handbook or author:smith',
        category: 'operator',
        icon: 'label'
      },
      {
        id: 'combine-filters',
        title: 'Combine Filters',
        description: 'Use the filter sidebar to narrow results by date, type, or source.',
        category: 'general',
        icon: 'filter_list'
      }
    ];
  }

  /**
   * Dismiss a tip
   */
  dismissTip(tipId: string): void {
    this.dismissedTips.add(tipId);
    this.saveDismissedTips();
    this.tips = this.tips.filter(tip => tip.id !== tipId);
  }

  /**
   * Dismiss all tips
   */
  dismissAll(): void {
    this.tips.forEach(tip => this.dismissedTips.add(tip.id));
    this.saveDismissedTips();
    this.tips = [];
  }

  /**
   * Load dismissed tips from localStorage
   */
  private loadDismissedTips(): void {
    try {
      const stored = localStorage.getItem('dismissed-search-tips');
      if (stored) {
        this.dismissedTips = new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading dismissed tips:', e);
    }
  }

  /**
   * Save dismissed tips to localStorage
   */
  private saveDismissedTips(): void {
    try {
      localStorage.setItem('dismissed-search-tips', JSON.stringify(Array.from(this.dismissedTips)));
    } catch (e) {
      console.error('Error saving dismissed tips:', e);
    }
  }

  /**
   * Check if tip should be shown
   */
  shouldShowTip(tip: SearchTip): boolean {
    return !this.dismissedTips.has(tip.id);
  }

  /**
   * Get visible tips
   */
  getVisibleTips(): SearchTip[] {
    return this.tips.filter(tip => this.shouldShowTip(tip));
  }
}
