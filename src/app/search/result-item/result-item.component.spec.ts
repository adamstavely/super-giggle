import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultItemComponent } from './result-item.component';
import { SearchResult } from '../search.models';

describe('ResultItemComponent', () => {
  let component: ResultItemComponent;
  let fixture: ComponentFixture<ResultItemComponent>;
  let mockResult: SearchResult;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResultItemComponent]
    });

    mockResult = {
      id: '1',
      title: 'Test Document',
      snippet: 'Test snippet',
      source: 'SharePoint',
      author: 'Test Author',
      lastModified: new Date(),
      fileType: 'PDF',
      url: '/test.pdf'
    };

    fixture = TestBed.createComponent(ResultItemComponent);
    component = fixture.componentInstance;
    component.result = mockResult;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle helpful click', () => {
    expect(component.helpfulClicked).toBe(false);
    component.onHelpfulClick();
    expect(component.helpfulClicked).toBe(true);
  });

  it('should handle not helpful click', () => {
    expect(component.notHelpfulClicked).toBe(false);
    component.onNotHelpfulClick();
    expect(component.notHelpfulClicked).toBe(true);
  });

  it('should get file type icon for PDF', () => {
    expect(component.getFileTypeIcon('PDF')).toBe('picture_as_pdf');
    expect(component.getFileTypeIcon('pdf')).toBe('picture_as_pdf');
  });

  it('should get file type icon for DOCX', () => {
    expect(component.getFileTypeIcon('DOCX')).toBe('description');
    expect(component.getFileTypeIcon('docx')).toBe('description');
  });

  it('should get file type icon for XLSX', () => {
    expect(component.getFileTypeIcon('XLSX')).toBe('table_chart');
    expect(component.getFileTypeIcon('xlsx')).toBe('table_chart');
  });

  it('should get default icon for unknown file type', () => {
    expect(component.getFileTypeIcon('unknown')).toBe('insert_drive_file');
  });
});
