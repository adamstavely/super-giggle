import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { SpellCorrection, QueryExpansion, SearchIntent } from '../../search/search.models';

@Injectable({
  providedIn: 'root'
})
export class QueryProcessingService {
  // Common synonyms dictionary (in production, this would come from a backend service)
  private synonyms: { [key: string]: string[] } = {
    'employee': ['staff', 'worker', 'personnel', 'team member'],
    'benefits': ['perks', 'advantages', 'compensation', 'rewards'],
    'policy': ['guideline', 'rule', 'procedure', 'regulation'],
    'vacation': ['holiday', 'time off', 'leave', 'PTO'],
    'handbook': ['manual', 'guide', 'directory', 'reference'],
    'support': ['help', 'assistance', 'aid', 'service'],
    'document': ['file', 'record', 'paper', 'report'],
    'search': ['find', 'look for', 'locate', 'discover']
  };

  // Common misspellings (in production, use a proper spell checker library)
  private commonMisspellings: { [key: string]: string } = {
    'benifits': 'benefits',
    'handbok': 'handbook',
    'polocy': 'policy',
    'vacaton': 'vacation',
    'employe': 'employee',
    'documant': 'document',
    'seach': 'search',
    'suport': 'support'
  };

  constructor() {}

  /**
   * Understand the intent of a search query with enhanced detection
   */
  detectIntent(query: string, context?: { previousQueries?: string[]; userRole?: string }): SearchIntent {
    const lowerQuery = query.toLowerCase().trim();
    
    // Check for advanced operators first (these indicate power user intent)
    const hasAdvancedOps = this.parseAdvancedOperators(query);
    if (hasAdvancedOps.regex || hasAdvancedOps.wildcards.length > 0 || hasAdvancedOps.proximity || hasAdvancedOps.fieldBoosts.length > 0) {
      return 'factual_query'; // Advanced operators suggest specific factual search
    }
    
    // Question detection (enhanced patterns)
    const questionPatterns = [
      /^(what|when|where|who|why|how|is|are|can|does|do|will|would|should|could)\s+/i,
      /\?$/,
      /^(tell me|show me|find me|give me|explain|describe)\s+/i
    ];
    
    for (const pattern of questionPatterns) {
      if (lowerQuery.match(pattern)) {
        return 'question';
      }
    }
    
    // Person search detection (enhanced)
    const personPatterns = [
      /\b(contact|email|phone|directory|find.*person|who is|who works|employee|staff member)\b/i,
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // Name pattern: "John Doe"
      /\b(extension|ext\.|x\d+)\b/i // Phone extension pattern
    ];
    
    for (const pattern of personPatterns) {
      if (lowerQuery.match(pattern)) {
        return 'person_search';
      }
    }
    
    // Navigational (specific document names or locations)
    const navigationalPatterns = [
      /\b(handbook|policy|guide|manual|form|template|document|file)\b/i,
      /^(go to|open|show|view)\s+/i,
      /\.(pdf|docx?|xlsx?|pptx?)$/i, // File extension
      /^\/[\w\/]+$/ // Path-like: "/path/to/document"
    ];
    
    for (const pattern of navigationalPatterns) {
      if (lowerQuery.match(pattern)) {
        return 'navigational';
      }
    }
    
    // Context-aware detection
    if (context?.previousQueries && context.previousQueries.length > 0) {
      const lastQuery = context.previousQueries[context.previousQueries.length - 1].toLowerCase();
      
      // If previous query was a question and this is a refinement
      if (lastQuery.match(/^(what|when|where|who|why|how)\s+/i)) {
        if (query.split(/\s+/).length <= 5) {
          return 'question'; // Likely a follow-up question
        }
      }
    }
    
    // Factual query (short, specific terms)
    const wordCount = query.split(/\s+/).length;
    if (wordCount <= 3 && !lowerQuery.includes('?') && wordCount > 0) {
      // Check if it's a specific term (not a question word)
      const isSpecificTerm = !lowerQuery.match(/^(what|when|where|who|why|how|is|are|can|does|do)\s+/i);
      if (isSpecificTerm) {
        return 'factual_query';
      }
    }
    
    // Default to exploratory
    return 'exploratory';
  }

  /**
   * Expand query with synonyms and related terms (enhanced)
   */
  expandQuery(query: string, options?: { maxExpansions?: number; includeRelated?: boolean }): Observable<QueryExpansion> {
    const maxExpansions = options?.maxExpansions || 3;
    const includeRelated = options?.includeRelated !== false;
    
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const addedTerms: string[] = [];
    const removedTerms: string[] = [];
    
    // Find synonyms for each word
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.synonyms[cleanWord]) {
        // Add synonyms (up to maxExpansions per word)
        const synonymsToAdd = this.synonyms[cleanWord].slice(0, maxExpansions);
        addedTerms.push(...synonymsToAdd);
      }
    });
    
    // Remove duplicate terms
    const uniqueAddedTerms = Array.from(new Set(addedTerms));
    
    // Build expanded query - combine original with expanded terms
    // Use OR logic: (original terms) OR (expanded terms)
    const expandedTerms = [...words, ...uniqueAddedTerms];
    const expanded = expandedTerms.join(' ');
    
    // Alternative: Use AND logic with parentheses
    // const expanded = `(${words.join(' ')}) (${uniqueAddedTerms.join(' ')})`;
    
    return of({
      original: query,
      expanded: expanded,
      addedTerms: uniqueAddedTerms,
      removedTerms: removedTerms
    }).pipe(delay(100)); // Simulate API call
  }

  /**
   * Check spelling and provide corrections
   */
  checkSpelling(query: string): Observable<SpellCorrection | null> {
    const words = query.split(/\s+/);
    let correctedQuery = query;
    const suggestions: string[] = [];
    let hasCorrections = false;
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (this.commonMisspellings[cleanWord]) {
        const correction = this.commonMisspellings[cleanWord];
        correctedQuery = correctedQuery.replace(
          new RegExp(word, 'i'),
          correction
        );
        suggestions.push(correction);
        hasCorrections = true;
      }
    });
    
    if (!hasCorrections) {
      return of(null);
    }
    
    return of({
      original: query,
      corrected: correctedQuery,
      suggestions: suggestions,
      confidence: 0.85
    }).pipe(delay(150)); // Simulate API call
  }

  /**
   * Interpret natural language query into structured search query
   */
  interpretQuery(query: string): string {
    const intent = this.detectIntent(query);
    let interpreted = query;
    
    // Remove question words for better search
    if (intent === 'question') {
      interpreted = query.replace(/^(what|when|where|who|why|how|is|are|can|does|do)\s+/i, '');
      interpreted = interpreted.replace(/\?/g, '').trim();
    }
    
    // Extract key terms (remove common words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const terms = interpreted.split(/\s+/).filter(term => 
      !stopWords.includes(term.toLowerCase()) && term.length > 2
    );
    
    return terms.join(' ');
  }

  /**
   * Parse query for advanced operators (proximity, wildcards, regex, field boosting)
   */
  parseAdvancedOperators(query: string): {
    proximity?: { terms: string[]; distance: number };
    wildcards: string[];
    regex?: string;
    fieldBoosts: Array<{ field: string; term: string; boost: number }>;
    isValid: boolean;
    errors: string[];
  } {
    const result: {
      proximity?: { terms: string[]; distance: number };
      wildcards: string[];
      regex?: string;
      fieldBoosts: Array<{ field: string; term: string; boost: number }>;
      isValid: boolean;
      errors: string[];
    } = {
      wildcards: [] as string[],
      fieldBoosts: [] as Array<{ field: string; term: string; boost: number }>,
      isValid: true,
      errors: []
    };
    
    // Parse proximity search: "word1 NEAR/5 word2" or "word1 word2"~5 or "phrase"~5
    const proximityPatterns = [
      /(\w+)\s+NEAR\/(\d+)\s+(\w+)/i,  // word1 NEAR/5 word2
      /(\w+)\s+~(\d+)\s+(\w+)/i,       // word1 ~5 word2
      /"([^"]+)"\s*~(\d+)/i             // "phrase"~5
    ];
    
    for (const pattern of proximityPatterns) {
      const match = query.match(pattern);
      if (match) {
        let terms: string[];
        let distance: number;
        
        if (match[1] && match[3]) {
          // Two word pattern
          terms = [match[1], match[3]];
          distance = parseInt(match[2], 10);
        } else if (match[1] && !match[3]) {
          // Phrase pattern
          terms = match[1].split(/\s+/);
          distance = parseInt(match[2], 10);
        } else {
          continue;
        }
        
        // Validate distance (typically 1-100)
        if (distance < 1 || distance > 100) {
          result.errors.push(`Proximity distance must be between 1 and 100, got ${distance}`);
          result.isValid = false;
        } else {
          result.proximity = { terms, distance };
        }
        break;
      }
    }
    
    // Parse wildcards: * (multiple chars) and ? (single char)
    // Support patterns like: test*, *test, te?t, test*ing
    const wildcardPattern = /(?:\b|\*|\?)[\w]*[\*?]+[\w]*(?:\b|\*|\?)/g;
    const wildcardMatches = query.match(wildcardPattern);
    if (wildcardMatches) {
      result.wildcards = wildcardMatches.map(w => w.trim());
      
      // Validate wildcard patterns (prevent excessive wildcards)
      result.wildcards.forEach(wildcard => {
        const starCount = (wildcard.match(/\*/g) || []).length;
        const questionCount = (wildcard.match(/\?/g) || []).length;
        if (starCount > 3 || questionCount > 10) {
          result.errors.push(`Wildcard pattern "${wildcard}" has too many wildcards`);
          result.isValid = false;
        }
      });
    }
    
    // Parse regex: /pattern/ or /pattern/flags
    const regexPattern = /\/([^\/]+)\/([gimsuy]*)/;
    const regexMatch = query.match(regexPattern);
    if (regexMatch) {
      const pattern = regexMatch[1];
      const flags = regexMatch[2] || '';
      
      // Validate regex pattern
      try {
        new RegExp(pattern, flags);
        result.regex = pattern;
        
        // Check for potentially dangerous patterns (ReDoS prevention)
        if (pattern.length > 100) {
          result.errors.push('Regex pattern is too long (max 100 characters)');
          result.isValid = false;
        }
      } catch (error) {
        result.errors.push(`Invalid regex pattern: ${(error as Error).message}`);
        result.isValid = false;
      }
    }
    
    // Parse field boosts: title:term^2, author:name^1.5, content:text^3
    // Supported fields: title, author, content, snippet, source
    const supportedFields = ['title', 'author', 'content', 'snippet', 'source'];
    const boostPattern = /(\w+):([^\s\^]+)\^(\d+(?:\.\d+)?)/g;
    let boostMatch;
    while ((boostMatch = boostPattern.exec(query)) !== null) {
      const field = boostMatch[1].toLowerCase();
      const term = boostMatch[2];
      const boost = parseFloat(boostMatch[3]);
      
      // Validate field
      if (!supportedFields.includes(field)) {
        result.errors.push(`Unsupported field for boosting: ${field}. Supported: ${supportedFields.join(', ')}`);
        result.isValid = false;
        continue;
      }
      
      // Validate boost value (typically 0.1 to 10)
      if (boost < 0.1 || boost > 10) {
        result.errors.push(`Boost value must be between 0.1 and 10, got ${boost}`);
        result.isValid = false;
        continue;
      }
      
      result.fieldBoosts.push({ field, term, boost });
    }
    
    return result;
  }

  /**
   * Validate advanced query operators
   */
  validateAdvancedQuery(query: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const parsed = this.parseAdvancedOperators(query);
    const warnings: string[] = [];
    
    // Check for conflicting operators
    if (parsed.regex && (parsed.wildcards.length > 0 || parsed.proximity)) {
      warnings.push('Using regex with wildcards or proximity may produce unexpected results');
    }
    
    // Check for too many operators
    const operatorCount = 
      (parsed.proximity ? 1 : 0) +
      parsed.wildcards.length +
      (parsed.regex ? 1 : 0) +
      parsed.fieldBoosts.length;
    
    if (operatorCount > 5) {
      warnings.push('Using many advanced operators may slow down search');
    }
    
    return {
      isValid: parsed.isValid,
      errors: parsed.errors,
      warnings
    };
  }
}
