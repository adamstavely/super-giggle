# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-11

### Changed
- Moved "Was this helpful?" feedback to same line as breadcrumb and right-aligned it for better space efficiency
- Updated README to accurately reflect current project state, features, and components

### Removed
- Removed orphaned `SearchTipsComponent` (not declared in module, never used)
- Removed orphaned `SearchBreadcrumbsComponent` (not declared in module, never used)
- Removed duplicate `QuickActionsMenuComponent` (inline implementation used instead)
- Removed unused `CameraService` (no camera features in application)
- Removed unused `HistoryService` (UndoRedoService used instead)
- Removed unused `SearchIndexService` (ClientIndexService used instead)
- Removed unused search-tips CSS from search-home component

### Fixed
- Code cleanup: Removed ~819 lines of unused/orphaned code

## [1.0.0] - 2024-03-15

### Added

#### Testing Infrastructure
- Comprehensive unit test suite for services and components
- Test utilities and mocks in `src/app/testing/`
- Test coverage goals: 70% minimum, 100% for critical paths
- Tests for SearchService, ThemeService, AppComponent, and search components

#### Code Quality
- ESLint configuration with Angular-specific rules
- Prettier configuration for consistent code formatting
- Pre-commit hooks with Husky and lint-staged
- Lint and format scripts in package.json

#### Error Handling
- HTTP error interceptor for global error handling
- Loading interceptor for request state management
- Error service for centralized error handling
- Global error handler for unhandled errors
- User-friendly error messages via MatSnackBar
- Retry logic for transient errors

#### Security
- Content Security Policy (CSP) meta tag
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- Security audit logging (mandatory, no opt-out)
- Dependency audit script

#### Monitoring & Analytics (Elastic Observability)
- Elastic logging service with ECS (Elastic Common Schema) compliance
- Error tracking service integrated with Elasticsearch
- Analytics service for user interaction tracking
- Audit service for security event logging
- ECS event models and helper functions
- Batch event processing with offline support
- All events logged in ECS format for compliance

#### Production Build Optimizations
- Production build configuration with optimizations
- Source maps disabled for production
- Build optimizer enabled
- License extraction enabled
- Bundle size budgets configured

#### Documentation
- Updated README with testing, linting, and deployment instructions
- CHANGELOG.md for version tracking
- Environment variable documentation

### Changed
- Updated environment files with Elasticsearch configuration
- Enhanced error handling throughout the application
- Improved security headers in index.html

### Security
- All user actions logged for security auditing (mandatory)
- No opt-out capability for analytics (security requirement)
- ECS-compliant logging for compliance
