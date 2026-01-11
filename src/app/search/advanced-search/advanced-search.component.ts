import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SearchFilters } from '../search.models';
import { QueryProcessingService } from '../../core/services/query-processing.service';

@Component({
  selector: 'app-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss']
})
export class AdvancedSearchComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<{ query: string; filters: SearchFilters }>();
  advancedSearchForm: FormGroup;
  booleanOperators = [
    { value: 'AND', label: 'All of these words (AND)' },
    { value: 'OR', label: 'Any of these words (OR)' },
    { value: 'NOT', label: 'None of these words (NOT)' }
  ];

  fileFormats = [
    { value: 'PDF', label: 'PDF' },
    { value: 'DOCX', label: 'Word Document' },
    { value: 'XLSX', label: 'Excel Spreadsheet' },
    { value: 'PPTX', label: 'PowerPoint' },
    { value: 'HTML', label: 'Web Page' },
    { value: 'TXT', label: 'Text File' }
  ];

  contentTypes = [
    { value: 'document', label: 'Document' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'spreadsheet', label: 'Spreadsheet' },
    { value: 'webpage', label: 'Web Page' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' }
  ];

  sourceSystems = [
    { value: 'sharepoint', label: 'SharePoint' },
    { value: 'onedrive', label: 'OneDrive' },
    { value: 'fileserver', label: 'File Server' },
    { value: 'wiki', label: 'Wiki' }
  ];

  validationErrors: string[] = [];
  validationWarnings: string[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private queryProcessingService: QueryProcessingService,
    private dialog: MatDialog
  ) {
    this.advancedSearchForm = this.fb.group({
      // Main query fields
      allWords: [''],
      exactPhrase: [''],
      anyWords: [''],
      noneWords: [''],
      
      // Field-specific searches
      titleContains: [''],
      authorContains: [''],
      contentContains: [''],
      
      // Filters
      fileFormats: [[]],
      contentTypes: [[]],
      sourceSystems: [[]],
      dateFrom: [null],
      dateTo: [null],
      
      // Boolean operator for main query
      booleanOperator: ['AND']
    });
  }

  ngOnInit(): void {
    // Check if there are query params to pre-fill the form
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.advancedSearchForm.patchValue({
          allWords: params['q']
        });
      }
    });
  }

  onSubmit(): void {
    if (this.advancedSearchForm.invalid) {
      return;
    }

    const formValue = this.advancedSearchForm.value;
    
    // Build the query string from form fields
    const queryParts: string[] = [];
    
    // Add exact phrase if provided
    if (formValue.exactPhrase) {
      queryParts.push(`"${formValue.exactPhrase}"`);
    }
    
    // Add all words
    if (formValue.allWords) {
      const words = formValue.allWords.split(/\s+/).filter((w: string) => w.trim());
      queryParts.push(...words);
    }
    
    // Add any words with OR operator
    if (formValue.anyWords) {
      const words = formValue.anyWords.split(/\s+/).filter((w: string) => w.trim());
      if (words.length > 0) {
        queryParts.push(`(${words.join(' OR ')})`);
      }
    }
    
    // Add none words with NOT operator
    if (formValue.noneWords) {
      const words = formValue.noneWords.split(/\s+/).filter((w: string) => w.trim());
      words.forEach((word: string) => {
        queryParts.push(`-${word}`);
      });
    }
    
    // Add field-specific searches
    if (formValue.titleContains) {
      queryParts.push(`title:${formValue.titleContains}`);
    }
    
    if (formValue.authorContains) {
      queryParts.push(`author:${formValue.authorContains}`);
    }
    
    if (formValue.contentContains) {
      queryParts.push(`content:${formValue.contentContains}`);
    }
    
    // Combine query parts with boolean operator
    const query = queryParts.length > 0 
      ? queryParts.join(` ${formValue.booleanOperator} `)
      : '';
    
    // Validate advanced query
    if (query) {
      const validation = this.queryProcessingService.validateAdvancedQuery(query);
      this.validationErrors = validation.errors;
      this.validationWarnings = validation.warnings;
      
      if (!validation.isValid && validation.errors.length > 0) {
        // Don't submit if there are errors
        return;
      }
    }
    
    // Build filters
    const filters: SearchFilters = {};
    
    if (formValue.fileFormats && formValue.fileFormats.length > 0) {
      filters.fileFormats = formValue.fileFormats;
    }
    
    if (formValue.contentTypes && formValue.contentTypes.length > 0) {
      filters.contentTypes = formValue.contentTypes;
    }
    
    if (formValue.sourceSystems && formValue.sourceSystems.length > 0) {
      filters.sourceSystems = formValue.sourceSystems;
    }
    
    if (formValue.dateFrom) {
      filters.dateFrom = formValue.dateFrom;
    }
    
    if (formValue.dateTo) {
      filters.dateTo = formValue.dateTo;
    }
    
    // Emit search event instead of navigating
    this.search.emit({ query, filters });
    this.close.emit();
  }

  onClear(): void {
    this.advancedSearchForm.reset({
      booleanOperator: 'AND',
      fileFormats: [],
      contentTypes: [],
      sourceSystems: []
    });
    this.validationErrors = [];
    this.validationWarnings = [];
  }

  onCancel(): void {
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.onClose();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
