import { Component, Input } from '@angular/core';
import { SearchResult } from '../search.models';

@Component({
  selector: 'app-featured-results',
  templateUrl: './featured-results.component.html',
  styleUrls: ['./featured-results.component.scss']
})
export class FeaturedResultsComponent {
  @Input() results: SearchResult[] = [];
  @Input() searchQuery: string = '';

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
