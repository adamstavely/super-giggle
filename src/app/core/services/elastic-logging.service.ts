import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ECSEventDocument } from '../models/ecs-event.model';

@Injectable({
  providedIn: 'root'
})
export class ElasticLoggingService {
  private eventQueue: ECSEventDocument[] = [];
  private flushInterval: number;
  private batchSize: number;
  private flushTimer?: ReturnType<typeof setInterval>;
  private isOnline = true;

  constructor(private http: HttpClient) {
    this.batchSize = environment.elasticsearch?.batchSize || 50;
    this.flushInterval = environment.elasticsearch?.flushInterval || 5000;

    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }

    // Start periodic flush
    this.startFlushTimer();
  }

  /**
   * Send event to Elasticsearch
   */
  logEvent(event: ECSEventDocument): void {
    // Add to queue
    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flushQueue();
    }
  }

  /**
   * Send multiple events in batch
   */
  logEvents(events: ECSEventDocument[]): void {
    this.eventQueue.push(...events);

    if (this.eventQueue.length >= this.batchSize) {
      this.flushQueue();
    }
  }

  /**
   * Flush queued events to Elasticsearch
   */
  flushQueue(): void {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    this.sendToElasticsearch(eventsToSend).subscribe({
      error: (error) => {
        // Re-queue events on error (with limit to prevent memory issues)
        if (this.eventQueue.length < 1000) {
          this.eventQueue.unshift(...eventsToSend);
        }
        console.error('Failed to send events to Elasticsearch:', error);
      }
    });
  }

  /**
   * Send events to Elasticsearch
   */
  private sendToElasticsearch(events: ECSEventDocument[]): Observable<any> {
    if (!environment.elasticsearch?.endpoint) {
      console.warn('Elasticsearch endpoint not configured');
      return of(null);
    }

    const url = `${environment.elasticsearch.endpoint}/${environment.elasticsearch.index}/_bulk`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-ndjson'
    });

    // Prepare authentication
    let authHeaders = headers;
    const elasticConfig = environment.elasticsearch;
    if (elasticConfig?.apiKey) {
      authHeaders = headers.set('Authorization', `ApiKey ${elasticConfig.apiKey}`);
    } else if (elasticConfig?.username && elasticConfig?.password) {
      const credentials = btoa(`${elasticConfig.username}:${elasticConfig.password}`);
      authHeaders = headers.set('Authorization', `Basic ${credentials}`);
    }

    // Format as NDJSON (newline-delimited JSON) for bulk API
    const bulkBody = events
      .map(event => {
        const action = { index: {} };
        return JSON.stringify(action) + '\n' + JSON.stringify(event);
      })
      .join('\n') + '\n';

    return this.http.post(url, bulkBody, { headers: authHeaders }).pipe(
      catchError((error) => {
        console.error('Elasticsearch bulk insert error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.flushInterval);
  }

  /**
   * Force immediate flush (useful on app shutdown)
   */
  forceFlush(): Observable<any> {
    return this.sendToElasticsearch([...this.eventQueue]);
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    // Flush remaining events
    this.flushQueue();
  }
}
