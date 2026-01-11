import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturedResultsComponent } from './featured-results.component';
import { SearchResult } from '../search.models';

describe('FeaturedResultsComponent', () => {
  let component: FeaturedResultsComponent;
  let fixture: ComponentFixture<FeaturedResultsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeaturedResultsComponent]
    });

    fixture = TestBed.createComponent(FeaturedResultsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get file type icon for PDF', () => {
    expect(component.getFileTypeIcon('PDF')).toBe('picture_as_pdf');
    expect(component.getFileTypeIcon('pdf')).toBe('picture_as_pdf');
  });

  it('should get file type icon for DOCX', () => {
    expect(component.getFileTypeIcon('DOCX')).toBe('description');
    expect(component.getFileTypeIcon('docx')).toBe('description');
  });

  it('should get default icon for unknown file type', () => {
    expect(component.getFileTypeIcon('unknown')).toBe('insert_drive_file');
  });

  it('should accept results input', () => {
    const results: SearchResult[] = [
      {
        id: '1',
        title: 'Test',
        snippet: 'Test snippet',
        source: 'Test',
        author: 'Test',
        lastModified: new Date(),
        fileType: 'PDF',
        url: '/test.pdf'
      }
    ];
    component.results = results;

    expect(component.results).toEqual(results);
  });

  it('should accept search query input', () => {
    component.searchQuery = 'test query';
    expect(component.searchQuery).toBe('test query');
  });
});
