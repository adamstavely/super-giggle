import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SavedSearchTemplate, SearchQuery } from '../../search/search.models';

@Injectable({
  providedIn: 'root'
})
export class SavedSearchTemplatesService {
  private readonly storageKey = 'intranet_search_templates';
  private readonly maxTemplates = 50;

  constructor() {}

  /**
   * Get all saved search templates
   */
  getTemplates(): Observable<SavedSearchTemplate[]> {
    try {
      const templatesJson = localStorage.getItem(this.storageKey);
      if (templatesJson) {
        const templates: SavedSearchTemplate[] = JSON.parse(templatesJson).map((t: any) => ({
          ...t,
          created: new Date(t.created),
          lastUsed: t.lastUsed ? new Date(t.lastUsed) : undefined
        }));
        return of(templates);
      }
    } catch (error) {
      console.error('Error reading saved search templates:', error);
    }
    return of([]);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Observable<SavedSearchTemplate | null> {
    return this.getTemplates().pipe(
      map(templates => templates.find(t => t.id === id) || null)
    );
  }

  /**
   * Save a new search template
   */
  saveTemplate(template: Omit<SavedSearchTemplate, 'id' | 'created'>): Observable<SavedSearchTemplate> {
    return this.getTemplates().pipe(
      map(templates => {
        try {
          const newTemplate: SavedSearchTemplate = {
            ...template,
            id: this.generateId(),
            created: new Date()
          };
          
          templates.push(newTemplate);
          
          // Keep only max templates
          if (templates.length > this.maxTemplates) {
            templates.sort((a, b) => {
              const aTime = a.lastUsed?.getTime() || a.created.getTime();
              const bTime = b.lastUsed?.getTime() || b.created.getTime();
              return bTime - aTime;
            });
            templates.splice(this.maxTemplates);
          }
          
          localStorage.setItem(this.storageKey, JSON.stringify(templates));
          return newTemplate;
        } catch (error) {
          console.error('Error saving search template:', error);
          throw error;
        }
      })
    );
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<SavedSearchTemplate>): Observable<SavedSearchTemplate> {
    return this.getTemplates().pipe(
      map(templates => {
        try {
          const index = templates.findIndex(t => t.id === id);
          
          if (index === -1) {
            throw new Error(`Template with id ${id} not found`);
          }
          
          templates[index] = { ...templates[index], ...updates };
          localStorage.setItem(this.storageKey, JSON.stringify(templates));
          
          return templates[index];
        } catch (error) {
          console.error('Error updating search template:', error);
          throw error;
        }
      })
    );
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): Observable<void> {
    return this.getTemplates().pipe(
      map(templates => {
        try {
          const filtered = templates.filter(t => t.id !== id);
          localStorage.setItem(this.storageKey, JSON.stringify(filtered));
          return undefined;
        } catch (error) {
          console.error('Error deleting search template:', error);
          throw error;
        }
      })
    );
  }

  /**
   * Mark template as used (update lastUsed timestamp)
   */
  markTemplateUsed(id: string): Observable<void> {
    return this.updateTemplate(id, { lastUsed: new Date() }).pipe(
      map(() => undefined)
    );
  }

  /**
   * Get default/predefined templates
   */
  getDefaultTemplates(): SavedSearchTemplate[] {
    return [
      {
        id: 'default-1',
        name: 'Recent Documents',
        description: 'Find documents modified in the last 30 days',
        query: {
          query: '*',
          filters: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          sort: 'date-desc'
        },
        created: new Date(),
        isPublic: true,
        category: 'Time-based'
      },
      {
        id: 'default-2',
        name: 'HR Policies',
        description: 'Search all HR policy documents',
        query: {
          query: 'policy',
          filters: {
            departments: ['HR Department']
          }
        },
        created: new Date(),
        isPublic: true,
        category: 'Department'
      },
      {
        id: 'default-3',
        name: 'PDF Documents Only',
        description: 'Search only PDF files',
        query: {
          query: '*',
          filters: {
            fileFormats: ['PDF']
          }
        },
        created: new Date(),
        isPublic: true,
        category: 'File Type'
      }
    ];
  }

  private generateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
