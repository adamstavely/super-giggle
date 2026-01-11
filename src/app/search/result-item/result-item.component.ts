import { Component, Input } from '@angular/core';
import { SearchResult } from '../search.models';

@Component({
  selector: 'app-result-item',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.scss']
})
export class ResultItemComponent {
  @Input() result!: SearchResult;
  @Input() searchQuery: string = '';

  helpfulClicked = false;
  notHelpfulClicked = false;
  
  onHelpfulClick(): void {
    this.helpfulClicked = true;
    // TODO: Send feedback to API
  }

  onNotHelpfulClick(): void {
    this.notHelpfulClicked = true;
    // TODO: Send feedback to API
  }

  // Cache for file type icons to avoid repeated lookups
  private static readonly FILE_TYPE_ICON_MAP: { [key: string]: string } = {
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

  getFileTypeIcon(fileType: string): string {
    return ResultItemComponent.FILE_TYPE_ICON_MAP[fileType.toLowerCase()] || 'insert_drive_file';
  }
}
