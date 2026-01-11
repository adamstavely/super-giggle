import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchFilters } from '../search.models';

@Component({
  selector: 'app-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss']
})
export class AdvancedSearchComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private router: Router
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
      dateFrom: [null],
      dateTo: [null],
      
      // Boolean operator for main query
      booleanOperator: ['AND']
    });
  }

  ngOnInit(): void {
    // Check if there are query params to pre-fill the form
    const queryParams = this.router.parseUrl(this.router.url).queryParams;
    if (queryParams['q']) {
      this.advancedSearchForm.patchValue({
        allWords: queryParams['q']
      });
    }
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
    
    // Build filters
    const filters: SearchFilters = {};
    
    if (formValue.fileFormats && formValue.fileFormats.length > 0) {
      filters.fileFormats = formValue.fileFormats;
    }
    
    if (formValue.contentTypes && formValue.contentTypes.length > 0) {
      filters.contentTypes = formValue.contentTypes;
    }
    
    if (formValue.dateFrom) {
      filters.dateFrom = formValue.dateFrom;
    }
    
    if (formValue.dateTo) {
      filters.dateTo = formValue.dateTo;
    }
    
    // Navigate to results page with query and filters
    const queryParams: any = {
      q: query
    };
    
    if (filters.fileFormats && filters.fileFormats.length > 0) {
      queryParams.fileFormats = filters.fileFormats.join(',');
    }
    
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      queryParams.contentTypes = filters.contentTypes.join(',');
    }
    
    if (filters.dateFrom) {
      queryParams.dateFrom = filters.dateFrom.toISOString();
    }
    
    if (filters.dateTo) {
      queryParams.dateTo = filters.dateTo.toISOString();
    }
    
    this.router.navigate(['/search/results'], { queryParams });
  }

  onClear(): void {
    this.advancedSearchForm.reset({
      booleanOperator: 'AND',
      fileFormats: [],
      contentTypes: []
    });
  }

  onCancel(): void {
    this.router.navigate(['/search']);
  }
}
