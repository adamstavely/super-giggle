import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ShareableSearchLink, SearchFilters } from '../../search/search.models';

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly baseUrl: string;
  private readonly defaultExpirationDays = 30;

  constructor() {
    // Get base URL from window location
    this.baseUrl = window.location.origin;
  }

  /**
   * Generate a shareable link for search results
   */
  generateShareableLink(
    query: string,
    filters?: SearchFilters,
    expiresInDays?: number
  ): Observable<ShareableSearchLink> {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + this.defaultExpirationDays * 24 * 60 * 60 * 1000);

    const shareableLink: ShareableSearchLink = {
      url: this.buildShareUrl(query, filters),
      query,
      filters,
      expiresAt,
      createdAt: new Date()
    };

    return of(shareableLink);
  }

  /**
   * Build shareable URL with encoded query and filters
   */
  private buildShareUrl(query: string, filters?: SearchFilters): string {
    const params = new URLSearchParams();
    params.set('q', query);

    if (filters) {
      if (filters.contentTypes && filters.contentTypes.length > 0) {
        params.set('contentTypes', filters.contentTypes.join(','));
      }
      if (filters.departments && filters.departments.length > 0) {
        params.set('departments', filters.departments.join(','));
      }
      if (filters.authors && filters.authors.length > 0) {
        params.set('authors', filters.authors.join(','));
      }
      if (filters.fileFormats && filters.fileFormats.length > 0) {
        params.set('fileFormats', filters.fileFormats.join(','));
      }
      if (filters.sourceSystems && filters.sourceSystems.length > 0) {
        params.set('sourceSystems', filters.sourceSystems.join(','));
      }
      if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.set('dateTo', filters.dateTo.toISOString());
      }
    }

    return `${this.baseUrl}/search/results?${params.toString()}`;
  }

  /**
   * Copy link to clipboard
   */
  async copyToClipboard(url: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Generate email share link (mailto:)
   */
  generateEmailLink(
    query: string,
    filters?: SearchFilters,
    subject?: string,
    body?: string
  ): string {
    const shareUrl = this.buildShareUrl(query, filters);
    const emailSubject = subject || `Shared Search: ${query}`;
    const emailBody = body || `I found this search result that might interest you:\n\n${shareUrl}`;

    const params = new URLSearchParams();
    params.set('subject', emailSubject);
    params.set('body', emailBody);

    return `mailto:?${params.toString()}`;
  }

  /**
   * Validate shareable link expiration
   */
  isLinkExpired(link: ShareableSearchLink): boolean {
    if (!link.expiresAt) {
      return false; // No expiration means it doesn't expire
    }
    return new Date() > link.expiresAt;
  }

  /**
   * Parse shareable link from URL
   */
  parseShareableLink(url: string): { query: string; filters?: SearchFilters } | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const query = params.get('q');
      if (!query) {
        return null;
      }

      const filters: SearchFilters = {};

      const contentTypes = params.get('contentTypes');
      if (contentTypes) {
        filters.contentTypes = contentTypes.split(',');
      }

      const departments = params.get('departments');
      if (departments) {
        filters.departments = departments.split(',');
      }

      const authors = params.get('authors');
      if (authors) {
        filters.authors = authors.split(',');
      }

      const fileFormats = params.get('fileFormats');
      if (fileFormats) {
        filters.fileFormats = fileFormats.split(',');
      }

      const sourceSystems = params.get('sourceSystems');
      if (sourceSystems) {
        filters.sourceSystems = sourceSystems.split(',');
      }

      const dateFrom = params.get('dateFrom');
      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom);
      }

      const dateTo = params.get('dateTo');
      if (dateTo) {
        filters.dateTo = new Date(dateTo);
      }

      return {
        query,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      };
    } catch (error) {
      console.error('Failed to parse shareable link:', error);
      return null;
    }
  }
}
