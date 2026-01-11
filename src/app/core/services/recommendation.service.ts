import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FeaturedResultRecommendation } from '../../search/search.models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Submit a featured result recommendation
   */
  submitRecommendation(recommendation: FeaturedResultRecommendation): Observable<void> {
    // For now, log to console and show success message
    // In production, this would call the API:
    // return this.http.post<void>(`${this.apiUrl}/recommendations`, recommendation)
    
    console.log('Recommendation submitted:', recommendation);
    
    // Show success message
    this.snackBar.open(
      'Thank you! Your recommendation has been submitted and will be reviewed.',
      'Close',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      }
    );

    // Return observable that completes immediately
    return of(void 0).pipe(
      tap(() => {
        // In production, you might want to track this event
        // this.analyticsService.trackEvent('recommendation_submitted', {
        //   query: recommendation.searchQuery
        // });
      }),
      catchError((error) => {
        console.error('Error submitting recommendation:', error);
        this.snackBar.open(
          'An error occurred while submitting your recommendation. Please try again later.',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
        throw error;
      })
    );
  }
}
