import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ElasticLoggingService } from './elastic-logging.service';
import { createECSEvent, ECSEventDocument } from '../models/ecs-event.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(
    private elasticLogging: ElasticLoggingService,
    private router: Router
  ) {}

  /**
   * Log authentication event
   */
  logAuthentication(action: 'login' | 'logout' | 'session_expired', userId?: string, username?: string): void {
    const event = createECSEvent(
      `auth_${action}`,
      'audit',
      'authentication',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': action === 'login' ? 'success' : 'unknown',
        'user.id': userId,
        'user.name': username,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Log authorization check
   */
  logAuthorization(resource: string, action: string, allowed: boolean, userId?: string): void {
    const event = createECSEvent(
      'authorization_check',
      'audit',
      'authorization',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': allowed ? 'success' : 'failure',
        'app.audit.resource': resource,
        'app.audit.action': action,
        'app.audit.allowed': allowed,
        'user.id': userId,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Log sensitive data access
   */
  logDataAccess(dataType: string, action: 'read' | 'write' | 'delete', userId?: string): void {
    const event = createECSEvent(
      'data_access',
      'audit',
      'access',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.audit.data_type': dataType,
        'app.audit.action': action,
        'user.id': userId,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Log configuration change
   */
  logConfigurationChange(setting: string, oldValue: any, newValue: any, userId?: string): void {
    const event = createECSEvent(
      'config_change',
      'audit',
      'change',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'success',
        'app.audit.setting': setting,
        'app.audit.old_value': String(oldValue),
        'app.audit.new_value': String(newValue),
        'user.id': userId,
        'app.route': this.router.url,
        'log.level': 'info'
      }
    );
    this.elasticLogging.logEvent(event);
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical', userId?: string): void {
    const event = createECSEvent(
      'security_event',
      'audit',
      'security',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'unknown',
        'app.audit.event_type': eventType,
        'app.audit.description': description,
        'app.audit.severity': severity,
        'user.id': userId,
        'app.route': this.router.url,
        'log.level': severity === 'critical' || severity === 'high' ? 'error' : 'warn'
      }
    );
    this.elasticLogging.logEvent(event);
  }
}
