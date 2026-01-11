import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SearchResult } from '../search.models';
import { RecommendationModalComponent, RecommendationModalData } from './recommendation-modal.component';

@Component({
  selector: 'app-featured-results',
  templateUrl: './featured-results.component.html',
  styleUrls: ['./featured-results.component.scss']
})
export class FeaturedResultsComponent {
  @Input() results: SearchResult[] = [];
  @Input() searchQuery: string = '';

  constructor(private dialog: MatDialog) {}

  openRecommendationModal(): void {
    const data: RecommendationModalData = {
      searchQuery: this.searchQuery,
      searchResults: this.results
    };

    this.dialog.open(RecommendationModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: data,
      disableClose: false
    });
  }

  getFileTypeIcon(fileType: string): string {
    const iconMap: { [key: string]: string } = {
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'xls': 'table_chart',
      'xlsx': 'table_chart',
      'ppt': 'slideshow',
      'pptx': 'slideshow',
      'txt': 'text_snippet',
      'html': 'code',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'video_library',
      'mov': 'video_library'
    };
    return iconMap[fileType.toLowerCase()] || 'insert_drive_file';
  }
}
