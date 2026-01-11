import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SearchQuery,
  SearchResponse,
  SearchResult,
  AutocompleteSuggestion,
  SearchHistory,
  SearchFilters
} from './search.models';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly apiUrl = environment.apiUrl;
  private readonly searchHistoryKey = 'intranet_search_history';
  private readonly maxHistoryItems = 20;

  constructor(private http: HttpClient) {}

  /**
   * Main search method
   */
  search(query: SearchQuery): Observable<SearchResponse> {
    const results = this.generateMockSearchResults(query);
    return of(results);
    
    // Original API call (commented out for mock data):
    // const params = this.buildSearchParams(query);
    // return this.http.post<SearchResponse>(`${this.apiUrl}/search`, query, { params })
    //   .pipe(
    //     retry(2),
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(query: string): Observable<AutocompleteSuggestion[]> {
    if (!query || query.length < 3) {
      return of([]);
    }

    // Return mock autocomplete suggestions
    const suggestions = this.generateMockAutocompleteSuggestions(query);
    return of(suggestions).pipe(
      debounceTime(200),
      distinctUntilChanged()
    );

    // Original API call (commented out for mock data):
    // const params = new HttpParams().set('q', query);
    // return this.http.get<AutocompleteSuggestion[]>(`${this.apiUrl}/search/autocomplete`, { params })
    //   .pipe(
    //     debounceTime(200),
    //     distinctUntilChanged(),
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(): Observable<string[]> {
    // Return mock trending searches
    const trending = [
      'Employee Benefits',
      'Holiday Schedule 2024',
      'Remote Work Policy',
      'IT Support',
      'Company Directory',
      'Expense Reimbursement',
      'Training Resources',
      'Health Insurance'
    ];
    return of(trending);

    // Original API call (commented out for mock data):
    // return this.http.get<string[]>(`${this.apiUrl}/search/trending`)
    //   .pipe(
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Get user search history from localStorage
   */
  getSearchHistory(): Observable<SearchHistory[]> {
    try {
      const historyJson = localStorage.getItem(this.searchHistoryKey);
      if (historyJson) {
        const history: SearchHistory[] = JSON.parse(historyJson).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        return of(history.slice(0, this.maxHistoryItems));
      }
    } catch (error) {
      console.error('Error reading search history:', error);
    }
    return of([]);
  }

  /**
   * Save search query to history
   */
  saveSearchHistory(query: string): void {
    if (!query || query.trim().length === 0) {
      return;
    }

    try {
      const historyJson = localStorage.getItem(this.searchHistoryKey);
      let history: SearchHistory[] = [];

      if (historyJson) {
        history = JSON.parse(historyJson).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }

      // Remove duplicate if exists
      history = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());

      // Add new query at the beginning
      history.unshift({
        query: query.trim(),
        timestamp: new Date()
      });

      // Keep only the last maxHistoryItems
      history = history.slice(0, this.maxHistoryItems);

      localStorage.setItem(this.searchHistoryKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    try {
      localStorage.removeItem(this.searchHistoryKey);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  /**
   * Build HTTP params from search query
   */
  private buildSearchParams(query: SearchQuery): HttpParams {
    let params = new HttpParams();

    if (query.page) {
      params = params.set('page', query.page.toString());
    }

    if (query.pageSize) {
      params = params.set('pageSize', query.pageSize.toString());
    }

    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    if (query.filters) {
      const filters = query.filters;
      
      if (filters.contentTypes && filters.contentTypes.length > 0) {
        params = params.set('contentTypes', filters.contentTypes.join(','));
      }

      if (filters.departments && filters.departments.length > 0) {
        params = params.set('departments', filters.departments.join(','));
      }

      if (filters.authors && filters.authors.length > 0) {
        params = params.set('authors', filters.authors.join(','));
      }

      if (filters.fileFormats && filters.fileFormats.length > 0) {
        params = params.set('fileFormats', filters.fileFormats.join(','));
      }

      if (filters.sourceSystems && filters.sourceSystems.length > 0) {
        params = params.set('sourceSystems', filters.sourceSystems.join(','));
      }

      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo.toISOString());
      }
    }

    return params;
  }

  /**
   * Generate mock search results
   */
  private generateMockSearchResults(query: SearchQuery): SearchResponse {
    const queryLower = query.query.toLowerCase();
    const page = query.page || 1;
    const pageSize = query.pageSize || 25;
    
    // Sample search results
    const allResults: SearchResult[] = [
      {
        id: '1',
        title: 'Employee Handbook 2024',
        snippet: `The complete employee handbook covering company policies, ${queryLower} procedures, benefits, and code of conduct. This document is updated annually and contains all the information you need to know about working at our company.`,
        source: 'SharePoint',
        author: 'HR Department',
        lastModified: new Date('2024-01-15'),
        fileType: 'PDF',
        url: '/documents/employee-handbook-2024.pdf',
        breadcrumb: ['Company Resources', 'HR Documents', 'Employee Handbook'],
        highlightedTerms: ['employee', 'handbook']
      },
      {
        id: '2',
        title: 'Remote Work Policy and Guidelines',
        snippet: `Comprehensive guide to our remote work ${queryLower} policy. Includes eligibility requirements, equipment provisions, communication expectations, and performance standards for remote employees.`,
        source: 'OneDrive',
        author: 'Jane Smith',
        lastModified: new Date('2024-02-20'),
        fileType: 'DOCX',
        url: '/documents/remote-work-policy.docx',
        breadcrumb: ['Policies', 'Work Arrangements'],
        highlightedTerms: ['remote', 'work', 'policy']
      },
      {
        id: '3',
        title: 'Q4 Financial Report 2023',
        snippet: `Quarterly financial report detailing revenue, expenses, and profit margins. This ${queryLower} document includes detailed analysis of Q4 performance and year-end financial summary.`,
        source: 'SharePoint',
        author: 'Finance Team',
        lastModified: new Date('2024-01-10'),
        fileType: 'XLSX',
        url: '/documents/q4-financial-report.xlsx',
        breadcrumb: ['Finance', 'Reports', 'Quarterly'],
        highlightedTerms: ['financial', 'report']
      },
      {
        id: '4',
        title: 'IT Support Ticket System Guide',
        snippet: `How to submit and track IT support tickets. Learn about our ${queryLower} ticketing system, response times, and how to get help with technical issues.`,
        source: 'Wiki',
        author: 'IT Department',
        lastModified: new Date('2024-03-01'),
        fileType: 'HTML',
        url: '/wiki/it-support-guide',
        breadcrumb: ['IT Resources', 'Support'],
        highlightedTerms: ['IT', 'support']
      },
      {
        id: '5',
        title: 'Company Holiday Schedule 2024',
        snippet: `Complete list of company holidays and office closures for 2024. Includes all ${queryLower} national holidays, company-specific days off, and early closure dates.`,
        source: 'SharePoint',
        author: 'HR Department',
        lastModified: new Date('2023-12-01'),
        fileType: 'PDF',
        url: '/documents/holiday-schedule-2024.pdf',
        breadcrumb: ['Company Resources', 'HR Documents'],
        highlightedTerms: ['holiday', 'schedule']
      },
      {
        id: '6',
        title: 'Benefits Enrollment Guide',
        snippet: `Step-by-step guide to enrolling in health insurance, dental, vision, and other ${queryLower} benefits. Includes deadlines, coverage options, and frequently asked questions.`,
        source: 'OneDrive',
        author: 'Benefits Team',
        lastModified: new Date('2024-01-05'),
        fileType: 'DOCX',
        url: '/documents/benefits-enrollment-guide.docx',
        breadcrumb: ['Benefits', 'Enrollment'],
        highlightedTerms: ['benefits', 'enrollment']
      },
      {
        id: '7',
        title: 'New Employee Onboarding Checklist',
        snippet: `Comprehensive checklist for new employee onboarding. Covers ${queryLower} paperwork, system access, training requirements, and first-week activities.`,
        source: 'SharePoint',
        author: 'HR Department',
        lastModified: new Date('2024-02-15'),
        fileType: 'PDF',
        url: '/documents/onboarding-checklist.pdf',
        breadcrumb: ['HR Documents', 'Onboarding'],
        highlightedTerms: ['employee', 'onboarding']
      },
      {
        id: '8',
        title: 'Expense Reimbursement Policy',
        snippet: `Guidelines for submitting expense reports and getting reimbursed. Includes ${queryLower} eligible expenses, submission deadlines, and required documentation.`,
        source: 'SharePoint',
        author: 'Finance Team',
        lastModified: new Date('2024-01-20'),
        fileType: 'PDF',
        url: '/documents/expense-reimbursement-policy.pdf',
        breadcrumb: ['Finance', 'Policies'],
        highlightedTerms: ['expense', 'reimbursement']
      },
      {
        id: '9',
        title: 'Security Best Practices Guide',
        snippet: `Essential security practices for protecting company data and ${queryLower} information. Covers password policies, phishing awareness, and data handling procedures.`,
        source: 'Wiki',
        author: 'Security Team',
        lastModified: new Date('2024-02-28'),
        fileType: 'HTML',
        url: '/wiki/security-best-practices',
        breadcrumb: ['IT Resources', 'Security'],
        highlightedTerms: ['security', 'practices']
      },
      {
        id: '10',
        title: 'Performance Review Process',
        snippet: `Overview of the annual performance review process. Explains ${queryLower} evaluation criteria, review timeline, and how to prepare for your review meeting.`,
        source: 'OneDrive',
        author: 'HR Department',
        lastModified: new Date('2024-01-30'),
        fileType: 'DOCX',
        url: '/documents/performance-review-process.docx',
        breadcrumb: ['HR Documents', 'Performance Management'],
        highlightedTerms: ['performance', 'review']
      },
      {
        id: '11',
        title: 'Company Directory - All Employees',
        snippet: `Complete directory of all employees with contact information, ${queryLower} departments, and office locations. Updated monthly with new hires and departures.`,
        source: 'SharePoint',
        author: 'HR Department',
        lastModified: new Date('2024-03-05'),
        fileType: 'XLSX',
        url: '/documents/company-directory.xlsx',
        breadcrumb: ['Company Resources', 'Directory'],
        highlightedTerms: ['company', 'directory']
      },
      {
        id: '12',
        title: 'Training and Development Resources',
        snippet: `List of available training courses, workshops, and ${queryLower} development opportunities. Includes both internal and external training options.`,
        source: 'Wiki',
        author: 'Learning & Development',
        lastModified: new Date('2024-02-10'),
        fileType: 'HTML',
        url: '/wiki/training-resources',
        breadcrumb: ['Resources', 'Training'],
        highlightedTerms: ['training', 'development']
      },
      {
        id: '13',
        title: 'Meeting Room Reservation Guide',
        snippet: `How to reserve meeting rooms and conference spaces. Includes ${queryLower} room availability, equipment, and reservation policies.`,
        source: 'SharePoint',
        author: 'Facilities Team',
        lastModified: new Date('2024-01-25'),
        fileType: 'PDF',
        url: '/documents/meeting-room-guide.pdf',
        breadcrumb: ['Facilities', 'Meeting Rooms'],
        highlightedTerms: ['meeting', 'room']
      },
      {
        id: '14',
        title: 'Code of Conduct and Ethics',
        snippet: `Company code of conduct outlining expected behavior, ethical ${queryLower} standards, and reporting procedures for violations.`,
        source: 'SharePoint',
        author: 'Legal Department',
        lastModified: new Date('2023-11-15'),
        fileType: 'PDF',
        url: '/documents/code-of-conduct.pdf',
        breadcrumb: ['Policies', 'Legal'],
        highlightedTerms: ['code', 'conduct']
      },
      {
        id: '15',
        title: 'IT Equipment Request Form',
        snippet: `Form to request new IT equipment including laptops, monitors, ${queryLower} accessories, and software licenses. Includes approval process and delivery timeline.`,
        source: 'OneDrive',
        author: 'IT Department',
        lastModified: new Date('2024-02-05'),
        fileType: 'DOCX',
        url: '/documents/it-equipment-request-form.docx',
        breadcrumb: ['IT Resources', 'Equipment'],
        highlightedTerms: ['IT', 'equipment']
      },
      {
        id: '16',
        title: 'Diversity and Inclusion Initiatives',
        snippet: `Overview of company diversity and inclusion programs, ${queryLower} initiatives, and employee resource groups.`,
        source: 'Wiki',
        author: 'D&I Committee',
        lastModified: new Date('2024-02-22'),
        fileType: 'HTML',
        url: '/wiki/diversity-inclusion',
        breadcrumb: ['Company Resources', 'Diversity'],
        highlightedTerms: ['diversity', 'inclusion']
      },
      {
        id: '17',
        title: 'Travel Policy and Guidelines',
        snippet: `Company travel policy covering booking procedures, ${queryLower} reimbursement, per diem rates, and travel safety guidelines.`,
        source: 'SharePoint',
        author: 'Finance Team',
        lastModified: new Date('2024-01-12'),
        fileType: 'PDF',
        url: '/documents/travel-policy.pdf',
        breadcrumb: ['Finance', 'Policies'],
        highlightedTerms: ['travel', 'policy']
      },
      {
        id: '18',
        title: 'Project Management Best Practices',
        snippet: `Guidelines for managing projects effectively. Includes ${queryLower} planning, execution, communication, and documentation standards.`,
        source: 'OneDrive',
        author: 'Project Management Office',
        lastModified: new Date('2024-02-18'),
        fileType: 'DOCX',
        url: '/documents/project-management-guide.docx',
        breadcrumb: ['Resources', 'Project Management'],
        highlightedTerms: ['project', 'management']
      },
      {
        id: '19',
        title: 'Emergency Procedures and Contacts',
        snippet: `Emergency procedures, evacuation plans, and important ${queryLower} contact numbers. Includes medical emergencies, fire safety, and security protocols.`,
        source: 'SharePoint',
        author: 'Safety Committee',
        lastModified: new Date('2024-01-08'),
        fileType: 'PDF',
        url: '/documents/emergency-procedures.pdf',
        breadcrumb: ['Safety', 'Emergency'],
        highlightedTerms: ['emergency', 'procedures']
      },
      {
        id: '20',
        title: 'Software License Inventory',
        snippet: `Complete inventory of all software licenses, subscriptions, ${queryLower} and usage statistics. Updated quarterly.`,
        source: 'SharePoint',
        author: 'IT Department',
        lastModified: new Date('2024-03-01'),
        fileType: 'XLSX',
        url: '/documents/software-licenses.xlsx',
        breadcrumb: ['IT Resources', 'Licenses'],
        highlightedTerms: ['software', 'license']
      },
      {
        id: '21',
        title: 'Customer Service Standards',
        snippet: `Standards and guidelines for customer service interactions. ${queryLower} Includes response times, communication protocols, and quality metrics.`,
        source: 'Wiki',
        author: 'Customer Success Team',
        lastModified: new Date('2024-02-12'),
        fileType: 'HTML',
        url: '/wiki/customer-service-standards',
        breadcrumb: ['Operations', 'Customer Service'],
        highlightedTerms: ['customer', 'service']
      },
      {
        id: '22',
        title: 'Budget Planning Template 2024',
        snippet: `Template for department budget planning. Includes ${queryLower} revenue projections, expense categories, and approval workflow.`,
        source: 'OneDrive',
        author: 'Finance Team',
        lastModified: new Date('2024-01-18'),
        fileType: 'XLSX',
        url: '/documents/budget-template-2024.xlsx',
        breadcrumb: ['Finance', 'Budgeting'],
        highlightedTerms: ['budget', 'planning']
      },
      {
        id: '23',
        title: 'Social Media Policy',
        snippet: `Guidelines for employee use of social media in relation to ${queryLower} company business. Includes do's and don'ts and examples.`,
        source: 'SharePoint',
        author: 'Marketing Department',
        lastModified: new Date('2024-02-25'),
        fileType: 'PDF',
        url: '/documents/social-media-policy.pdf',
        breadcrumb: ['Policies', 'Marketing'],
        highlightedTerms: ['social', 'media']
      },
      {
        id: '24',
        title: 'Vendor Management Process',
        snippet: `Process for selecting, onboarding, and managing vendors. ${queryLower} Includes evaluation criteria and contract templates.`,
        source: 'Wiki',
        author: 'Procurement Team',
        lastModified: new Date('2024-01-22'),
        fileType: 'HTML',
        url: '/wiki/vendor-management',
        breadcrumb: ['Operations', 'Procurement'],
        highlightedTerms: ['vendor', 'management']
      },
      {
        id: '25',
        title: 'Data Privacy and GDPR Compliance',
        snippet: `Company policies and procedures for data privacy and ${queryLower} GDPR compliance. Includes data handling and protection requirements.`,
        source: 'SharePoint',
        author: 'Legal Department',
        lastModified: new Date('2024-02-08'),
        fileType: 'PDF',
        url: '/documents/data-privacy-gdpr.pdf',
        breadcrumb: ['Legal', 'Compliance'],
        highlightedTerms: ['data', 'privacy']
      }
    ];

    // Filter results based on query (simple keyword matching)
    let filteredResults = allResults;
    if (queryLower) {
      filteredResults = allResults.filter(result => 
        result.title.toLowerCase().includes(queryLower) ||
        result.snippet.toLowerCase().includes(queryLower) ||
        result.author.toLowerCase().includes(queryLower)
      );
    }

    // Apply sorting
    if (query.sort) {
      filteredResults = this.sortResults(filteredResults, query.sort);
    }

    // Calculate pagination
    const totalCount = filteredResults.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredResults.length);
    const paginatedResults = filteredResults.slice(startIndex, endIndex);
    
    // Limit results to prevent performance issues
    const maxResults = 25;
    const limitedResults = paginatedResults.slice(0, maxResults);

    // Generate featured results (only on first page)
    const featuredResults: SearchResult[] = page === 1 ? [
      {
        id: 'featured-1',
        title: 'Employee Benefits Portal - Quick Access',
        snippet: 'Access your health insurance, dental, vision, and retirement benefits all in one place. Update your selections, view coverage details, and find answers to common questions.',
        source: 'Benefits Portal',
        author: 'Benefits Team',
        lastModified: new Date('2024-03-10'),
        fileType: 'HTML',
        url: '/benefits/portal',
        breadcrumb: ['Benefits', 'Portal'],
        highlightedTerms: ['benefits', 'portal']
      },
      {
        id: 'featured-2',
        title: 'IT Help Desk - Get Support Now',
        snippet: 'Need technical assistance? Submit a ticket, chat with support, or browse our knowledge base. Average response time: 15 minutes during business hours.',
        source: 'IT Services',
        author: 'IT Department',
        lastModified: new Date('2024-03-12'),
        fileType: 'HTML',
        url: '/it/helpdesk',
        breadcrumb: ['IT', 'Support'],
        highlightedTerms: ['IT', 'support', 'help']
      },
      {
        id: 'featured-3',
        title: 'Company Directory - Find Colleagues',
        snippet: 'Search for employees by name, department, or location. View contact information, office locations, and organizational structure. Updated daily.',
        source: 'HR System',
        author: 'HR Department',
        lastModified: new Date('2024-03-15'),
        fileType: 'HTML',
        url: '/directory',
        breadcrumb: ['Company', 'Directory'],
        highlightedTerms: ['directory', 'employees', 'colleagues']
      }
    ] : [];

    return {
      results: limitedResults,
      featuredResults: featuredResults,
      totalCount: totalCount,
      searchTime: Math.random() * 100 + 50, // Random time between 50-150ms
      query: query.query,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    };
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sort: string): SearchResult[] {
    const sorted = [...results];
    
    switch (sort) {
      case 'date-desc':
        sorted.sort((a, b) => {
          const dateA = new Date(a.lastModified).getTime();
          const dateB = new Date(b.lastModified).getTime();
          return dateB - dateA;
        });
        break;
      case 'date-asc':
        sorted.sort((a, b) => {
          const dateA = new Date(a.lastModified).getTime();
          const dateB = new Date(b.lastModified).getTime();
          return dateA - dateB;
        });
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'author-asc':
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'author-desc':
        sorted.sort((a, b) => b.author.localeCompare(a.author));
        break;
      // 'relevance' is default, no sorting needed
    }
    
    return sorted;
  }

  /**
   * Generate mock autocomplete suggestions
   */
  private generateMockAutocompleteSuggestions(query: string): AutocompleteSuggestion[] {
    const queryLower = query.toLowerCase();
    const allSuggestions: AutocompleteSuggestion[] = [
      { text: 'Employee Benefits', type: 'query', count: 1250 },
      { text: 'Holiday Schedule', type: 'query', count: 890 },
      { text: 'Remote Work Policy', type: 'document', count: 450 },
      { text: 'IT Support', type: 'query', count: 320 },
      { text: 'Company Directory', type: 'query', count: 2100 },
      { text: 'Expense Reimbursement', type: 'query', count: 680 },
      { text: 'Training Resources', type: 'query', count: 540 },
      { text: 'Health Insurance', type: 'query', count: 1200 },
      { text: 'Performance Review', type: 'query', count: 380 },
      { text: 'Security Guidelines', type: 'document', count: 290 },
      { text: 'John Doe', type: 'person', count: 15 },
      { text: 'Jane Smith', type: 'person', count: 12 },
      { text: 'Engineering Department', type: 'department', count: 450 },
      { text: 'Marketing Department', type: 'department', count: 320 },
      { text: 'HR Department', type: 'department', count: 280 }
    ];

    // Filter suggestions based on query
    return allSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(queryLower)
    ).slice(0, 8); // Limit to 8 suggestions
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
