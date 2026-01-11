import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SearchService } from '../search.service';
import { SearchFilters, FilterOptions, FilterOption } from '../search.models';

@Component({
  selector: 'app-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss']
})
export class FilterSidebarComponent implements OnInit, OnDestroy {
  @Input() currentQuery: string = '';
  @Output() filtersChange = new EventEmitter<SearchFilters>();

  filterForm: FormGroup;
  filterOptions: FilterOptions = {
    contentTypes: [],
    departments: [],
    authors: [],
    fileFormats: [],
    sourceSystems: []
  };

  activeFilters: SearchFilters = {};
  private destroy$ = new Subject<void>();
  private isInitialized = false;

  constructor(private searchService: SearchService) {
    this.filterForm = new FormGroup({
      contentTypes: new FormControl([]),
      departments: new FormControl([]),
      authors: new FormControl([]),
      fileFormats: new FormControl([]),
      sourceSystems: new FormControl([]),
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null)
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();
    // Delay setup to prevent initial emission
    setTimeout(() => {
      this.setupFormListeners();
      this.isInitialized = true;
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFormListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300) // Debounce to prevent rapid emissions
      )
      .subscribe(() => {
        // Only emit if initialized and form actually changed
        if (this.isInitialized) {
          this.updateActiveFilters();
        }
      });
  }

  updateActiveFilters(): void {
    const formValue = this.filterForm.value;
    this.activeFilters = {
      contentTypes: formValue.contentTypes?.length > 0 ? formValue.contentTypes : undefined,
      departments: formValue.departments?.length > 0 ? formValue.departments : undefined,
      authors: formValue.authors?.length > 0 ? formValue.authors : undefined,
      fileFormats: formValue.fileFormats?.length > 0 ? formValue.fileFormats : undefined,
      sourceSystems: formValue.sourceSystems?.length > 0 ? formValue.sourceSystems : undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined
    };

    this.filtersChange.emit(this.activeFilters);
  }

  loadFilterOptions(): void {
    // TODO: Load from API when endpoint is available
    // For now, using mock data
    this.filterOptions = {
      contentTypes: [
        { label: 'Documents', value: 'document', count: 1250 },
        { label: 'Presentations', value: 'presentation', count: 340 },
        { label: 'Spreadsheets', value: 'spreadsheet', count: 890 },
        { label: 'Images', value: 'image', count: 2100 },
        { label: 'Videos', value: 'video', count: 120 }
      ],
      departments: [
        { label: 'Engineering', value: 'engineering', count: 450 },
        { label: 'Marketing', value: 'marketing', count: 320 },
        { label: 'Sales', value: 'sales', count: 280 },
        { label: 'HR', value: 'hr', count: 150 },
        { label: 'Finance', value: 'finance', count: 200 }
      ],
      authors: [
        { label: 'John Doe', value: 'john.doe', count: 45 },
        { label: 'Jane Smith', value: 'jane.smith', count: 38 },
        { label: 'Bob Johnson', value: 'bob.johnson', count: 32 }
      ],
      fileFormats: [
        { label: 'PDF', value: 'pdf', count: 850 },
        { label: 'Word', value: 'docx', count: 620 },
        { label: 'Excel', value: 'xlsx', count: 480 },
        { label: 'PowerPoint', value: 'pptx', count: 340 },
        { label: 'Image', value: 'image', count: 2100 }
      ],
      sourceSystems: [
        { label: 'SharePoint', value: 'sharepoint', count: 1200 },
        { label: 'OneDrive', value: 'onedrive', count: 800 },
        { label: 'File Server', value: 'fileserver', count: 600 },
        { label: 'Wiki', value: 'wiki', count: 300 }
      ]
    };
  }

  removeFilter(type: keyof SearchFilters, value?: string): void {
    const control = this.filterForm.get(type);
    if (control) {
      if (type === 'dateFrom' || type === 'dateTo') {
        control.setValue(null);
      } else {
        const currentValue = control.value as string[];
        if (value) {
          const newValue = currentValue.filter(v => v !== value);
          control.setValue(newValue);
        } else {
          control.setValue([]);
        }
      }
    }
  }

  clearAllFilters(): void {
    this.filterForm.reset({
      contentTypes: [],
      departments: [],
      authors: [],
      fileFormats: [],
      sourceSystems: [],
      dateFrom: null,
      dateTo: null
    });
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      (formValue.contentTypes?.length > 0) ||
      (formValue.departments?.length > 0) ||
      (formValue.authors?.length > 0) ||
      (formValue.fileFormats?.length > 0) ||
      (formValue.sourceSystems?.length > 0) ||
      formValue.dateFrom ||
      formValue.dateTo
    );
  }

  getActiveFiltersCount(): number {
    let count = 0;
    const formValue = this.filterForm.value;
    if (formValue.contentTypes?.length) count += formValue.contentTypes.length;
    if (formValue.departments?.length) count += formValue.departments.length;
    if (formValue.authors?.length) count += formValue.authors.length;
    if (formValue.fileFormats?.length) count += formValue.fileFormats.length;
    if (formValue.sourceSystems?.length) count += formValue.sourceSystems.length;
    if (formValue.dateFrom) count++;
    if (formValue.dateTo) count++;
    return count;
  }

  getFilterLabel(type: keyof FilterOptions, value: string): string {
    const options = this.filterOptions[type];
    const option = options.find(opt => opt.value === value);
    return option?.label || value;
  }

  // Getters for form controls to use in template
  get contentTypesControl(): FormControl {
    return this.filterForm.get('contentTypes') as FormControl;
  }

  get departmentsControl(): FormControl {
    return this.filterForm.get('departments') as FormControl;
  }

  get authorsControl(): FormControl {
    return this.filterForm.get('authors') as FormControl;
  }

  get fileFormatsControl(): FormControl {
    return this.filterForm.get('fileFormats') as FormControl;
  }

  get sourceSystemsControl(): FormControl {
    return this.filterForm.get('sourceSystems') as FormControl;
  }

  get dateFromControl(): FormControl {
    return this.filterForm.get('dateFrom') as FormControl;
  }

  get dateToControl(): FormControl {
    return this.filterForm.get('dateTo') as FormControl;
  }
}
