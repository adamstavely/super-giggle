import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { FilterSidebarComponent } from './filter-sidebar.component';
import { SearchService } from '../search.service';

describe('FilterSidebarComponent', () => {
  let component: FilterSidebarComponent;
  let fixture: ComponentFixture<FilterSidebarComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;

  beforeEach(() => {
    searchServiceSpy = jasmine.createSpyObj('SearchService', ['getFilterOptions']);

    TestBed.configureTestingModule({
      declarations: [FilterSidebarComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(FilterSidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize filter form', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('contentTypes')).toBeDefined();
    expect(component.filterForm.get('fileFormats')).toBeDefined();
  });

  it('should emit filters change', (done) => {
    spyOn(component.filtersChange, 'emit');
    
    // Wait for initialization
    setTimeout(() => {
      component.filterForm.patchValue({
        fileFormats: ['PDF']
      });
      
      setTimeout(() => {
        expect(component.filtersChange.emit).toHaveBeenCalled();
        done();
      }, 200);
    }, 150);
  });

  it('should clear filters', () => {
    component.filterForm.patchValue({
      fileFormats: ['PDF'],
      contentTypes: ['document']
    });

    component.clearFilters();

    expect(component.filterForm.get('fileFormats')?.value).toEqual([]);
    expect(component.filterForm.get('contentTypes')?.value).toEqual([]);
  });
});
