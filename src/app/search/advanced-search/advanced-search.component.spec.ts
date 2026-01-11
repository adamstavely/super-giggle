import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdvancedSearchComponent } from './advanced-search.component';

describe('AdvancedSearchComponent', () => {
  let component: AdvancedSearchComponent;
  let fixture: ComponentFixture<AdvancedSearchComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [AdvancedSearchComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    });

    fixture = TestBed.createComponent(AdvancedSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize advanced search form', () => {
    expect(component.advancedSearchForm).toBeDefined();
    expect(component.advancedSearchForm.get('allWords')).toBeDefined();
    expect(component.advancedSearchForm.get('exactPhrase')).toBeDefined();
  });

  it('should have boolean operators', () => {
    expect(component.booleanOperators.length).toBeGreaterThan(0);
    expect(component.booleanOperators[0].value).toBe('AND');
  });

  it('should have file formats', () => {
    expect(component.fileFormats.length).toBeGreaterThan(0);
  });

  it('should have content types', () => {
    expect(component.contentTypes.length).toBeGreaterThan(0);
  });
});
