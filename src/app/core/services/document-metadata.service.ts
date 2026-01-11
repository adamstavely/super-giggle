import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DocumentMetadata } from '../../search/search.models';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentMetadataService {
  private readonly metadataCacheKey = 'document_metadata_';
  private readonly metadataTTL = 60 * 60 * 1000; // 1 hour
  private readonly averageReadingSpeed = 200; // words per minute

  constructor(private cacheService: CacheService) {}

  /**
   * Get document metadata (file size, word count, reading time, etc.)
   */
  getMetadata(documentUrl: string, fileType?: string, content?: string): Observable<DocumentMetadata> {
    const cacheKey = `${this.metadataCacheKey}${documentUrl}`;

    // Check cache first
    if (this.cacheService.has(cacheKey)) {
      return this.cacheService.get<DocumentMetadata>(cacheKey).pipe(
        map(cached => cached || this.generateMetadata(documentUrl, fileType, content))
      );
    }

    // Generate metadata
    const metadata = this.generateMetadata(documentUrl, fileType, content);

    // Cache the metadata
    this.cacheService.set(cacheKey, metadata, this.metadataTTL);

    return of(metadata);
  }

  /**
   * Calculate reading time from word count
   */
  calculateReadingTime(wordCount: number): number {
    if (wordCount <= 0) {
      return 0;
    }
    return Math.ceil(wordCount / this.averageReadingSpeed);
  }

  /**
   * Estimate word count from text content
   */
  estimateWordCount(content: string): number {
    if (!content) {
      return 0;
    }
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get file size from URL (if available in headers or metadata)
   */
  getFileSize(url: string): Observable<number | undefined> {
    // In a real implementation, this would fetch the file headers
    // For now, return undefined as we don't have access to file size without fetching
    return of(undefined);
  }

  /**
   * Generate metadata for a document
   */
  private generateMetadata(
    documentUrl: string,
    fileType?: string,
    content?: string
  ): DocumentMetadata {
    const metadata: DocumentMetadata = {};

    // Estimate word count from content if available
    if (content) {
      metadata.wordCount = this.estimateWordCount(content);
      metadata.readingTime = this.calculateReadingTime(metadata.wordCount);
    }

    // Set language (default to English, could be detected)
    metadata.language = 'en';

    // Estimate page count for PDFs (rough estimate: 250 words per page)
    if (fileType?.toLowerCase() === 'pdf' && metadata.wordCount) {
      metadata.pageCount = Math.ceil((metadata.wordCount || 0) / 250);
    }

    // For images, we might have dimensions (would need to fetch image)
    if (fileType && ['jpg', 'jpeg', 'png', 'gif', 'png', 'webp'].includes(fileType.toLowerCase())) {
      // Dimensions would be fetched from image metadata
      metadata.dimensions = undefined;
    }

    return metadata;
  }

  /**
   * Clear metadata cache for a specific document
   */
  clearMetadataCache(documentUrl: string): void {
    const cacheKey = `${this.metadataCacheKey}${documentUrl}`;
    this.cacheService.delete(cacheKey);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format reading time for display
   */
  formatReadingTime(minutes: number): string {
    if (minutes < 1) {
      return 'Less than 1 min';
    }
    if (minutes === 1) {
      return '1 min read';
    }
    return `${minutes} min read`;
  }
}
