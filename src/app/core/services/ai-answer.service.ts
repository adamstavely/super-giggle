import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AIAnswer } from '../../search/search.models';

@Injectable({
  providedIn: 'root'
})
export class AIAnswerService {
  // Mock knowledge base (in production, this would connect to an AI service)
  private knowledgeBase: { [key: string]: { answer: string; sources: string[] } } = {
    'vacation policy': {
      answer: 'Employees are entitled to 20 days of paid vacation per year. Vacation requests must be submitted at least 2 weeks in advance through the HR portal. Unused vacation days can be carried over up to 5 days to the next year.',
      sources: ['1', '5'] // Document IDs
    },
    'remote work policy': {
      answer: 'Remote work is available for eligible employees. Eligibility is determined by role, manager approval, and job requirements. Remote employees must have a dedicated workspace and reliable internet connection. Regular check-ins with managers are required.',
      sources: ['2']
    },
    'employee benefits': {
      answer: 'Our benefits package includes health insurance (medical, dental, vision), 401(k) with company match, life insurance, disability insurance, and flexible spending accounts. Open enrollment occurs annually in November.',
      sources: ['6']
    },
    'expense reimbursement': {
      answer: 'Expense reports must be submitted within 30 days of incurring expenses. Eligible expenses include business travel, meals (with receipts), and approved business purchases. Reimbursement typically takes 5-7 business days after approval.',
      sources: ['8']
    },
    'it support': {
      answer: 'IT support is available Monday-Friday 8 AM - 6 PM. Submit tickets through the IT portal or call the help desk at extension 1234. For urgent issues outside business hours, contact the on-call IT support line.',
      sources: ['4', '15']
    },
    'holiday schedule': {
      answer: 'The company observes 10 paid holidays per year, including New Year\'s Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, and Christmas. Additional company-specific holidays are announced annually.',
      sources: ['5']
    }
  };

  constructor() {}

  /**
   * Generate AI-powered answer for a query
   */
  generateAnswer(query: string): Observable<AIAnswer | null> {
    const lowerQuery = query.toLowerCase();
    
    // Check if we have a matching answer in knowledge base
    for (const [key, value] of Object.entries(this.knowledgeBase)) {
      if (lowerQuery.includes(key) || this.isQueryRelated(lowerQuery, key)) {
        return of({
          answer: value.answer,
          confidence: 0.9,
          sources: value.sources,
          query: query
        }).pipe(delay(300)); // Simulate API call
      }
    }
    
    // For question-style queries, provide a generic helpful response
    if (this.isQuestionQuery(query)) {
      return of({
        answer: 'I found relevant documents that may answer your question. Please review the search results below for detailed information.',
        confidence: 0.6,
        sources: [],
        query: query
      }).pipe(delay(300));
    }
    
    return of(null);
  }

  /**
   * Check if query is related to a knowledge base entry
   */
  private isQueryRelated(query: string, key: string): boolean {
    const queryWords = query.split(/\s+/);
    const keyWords = key.split(/\s+/);
    
    // If at least 2 words match, consider it related
    const matches = keyWords.filter(kw => queryWords.some(qw => qw.includes(kw) || kw.includes(qw)));
    return matches.length >= Math.min(2, keyWords.length);
  }

  /**
   * Check if query is a question
   */
  private isQuestionQuery(query: string): boolean {
    return /^(what|when|where|who|why|how|is|are|can|does|do)\s+/i.test(query) || query.includes('?');
  }
}
