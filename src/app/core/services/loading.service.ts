import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private activeRequests = 0;

  /**
   * Set loading state to true
   */
  setLoading(loading: boolean): void {
    if (loading) {
      this.activeRequests++;
    } else {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
    }
    this.loadingSubject.next(this.activeRequests > 0);
  }

  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Reset loading state
   */
  reset(): void {
    this.activeRequests = 0;
    this.loadingSubject.next(false);
  }
}
