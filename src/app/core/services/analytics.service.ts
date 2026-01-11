import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ElasticLoggingService } from './elastic-logging.service';
import { createECSEvent, ECSEventDocument } from '../models/ecs-event.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private routerSubscription?: Subscription;

  constructor(
    private elasticLogging: ElasticLoggingService,
    private router: Router
  ) {
    // Track page views automatically
    this.trackPageViews();
  }

  /**
   * Track page views automatically
   */
  private trackPageViews(): void {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Track page view
   */
  trackPageView(route: string): void {
    const event = createECSEvent(
      'page_view',
      'web',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.route': route,
        'app.user_agent': typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Track search query
   */
  trackSearch(query: string, resultCount?: number, filters?: Record<string, any>): void {
    const event = createECSEvent(
      'search',
      'user',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.search.query': query,
        'app.search.result_count': resultCount,
        'app.search.filters': filters,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Track result click
   */
  trackResultClick(resultId: string, resultUrl: string, query?: string): void {
    const event = createECSEvent(
      'click',
      'user',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.click.result_id': resultId,
        'app.click.result_url': resultUrl,
        'app.search.query': query,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Track filter usage
   */
  trackFilter(filterType: string, filterValue: any): void {
    const event = createECSEvent(
      'filter',
      'user',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.filter.type': filterType,
        'app.filter.value': filterValue,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Track advanced search usage
   */
  trackAdvancedSearch(query: string, filters?: Record<string, any>): void {
    const event = createECSEvent(
      'advanced_search',
      'user',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.search.query': query,
        'app.search.filters': filters,
        'app.search.advanced': true,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string, formData?: Record<string, any>): void {
    const event = createECSEvent(
      'form_submit',
      'user',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.form.name': formName,
        'app.form.data': formData,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Track navigation event
   */
  trackNavigation(fromRoute: string, toRoute: string): void {
    const event = createECSEvent(
      'navigation',
      'user',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.navigation.from': fromRoute,
        'app.navigation.to': toRoute,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Cleanup subscriptions
   */
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
