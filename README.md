# Enterprise Intranet Search Interface

A comprehensive Angular-based search interface for enterprise intranets, designed to connect with Elasticsearch backends. This application provides a modern, responsive search experience with advanced filtering, sorting, and content type categorization.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Development](#development)
- [API Integration](#api-integration)
- [Components](#components)
- [Routing](#routing)
- [Styling](#styling)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This application provides a full-featured search interface for employee intranets, featuring:

- **Search Homepage**: Landing page with search bar, trending searches, and quick links
- **Search Results**: Comprehensive results display with filtering, sorting, and pagination
- **Advanced Search**: Form-based advanced search with boolean operators and field-specific queries
- **Content Type Tabs**: Filter results by content type (All, News, Video, Images, Sites)
- **Autocomplete**: Real-time search suggestions as you type
- **Search History**: Local storage of recent searches
- **Responsive Design**: Mobile-first approach with Material Design

## ✨ Features

### Core Search Features

- **Basic Search**: Simple text search with instant results
- **Advanced Search**: 
  - Boolean operators (AND, OR, NOT)
  - Exact phrase matching with quotation marks
  - Field-specific searches (title, author, content)
  - Date range filtering
  - File format and content type filters
- **Autocomplete**: Real-time suggestions with debouncing (200ms)
- **Search History**: Persistent search history stored in localStorage
- **Trending Searches**: Display of popular search queries

### Results Display

- **Content Type Tabs**: Filter by All, News, Video, Images, or Sites
- **Sorting Options**: 
  - Relevance (default)
  - Date (newest/oldest)
  - Title (A-Z / Z-A)
  - Author (A-Z / Z-A)
- **Pagination**: Configurable results per page (10, 25, 50)
- **Result Metadata**: 
  - Title with clickable links
  - Snippet with highlighted terms
  - Source system, author, last modified date
  - File type indicators
  - Breadcrumb navigation
  - Thumbnail previews (for images/videos)
- **Feedback System**: "Was this helpful?" buttons for result quality feedback

### Filtering

- **Content Types**: Filter by document type (document, presentation, spreadsheet, etc.)
- **File Formats**: Filter by file extension (PDF, DOCX, XLSX, etc.)
- **Date Range**: Filter results by modification date
- **Departments**: Filter by organizational department
- **Authors**: Filter by document author
- **Source Systems**: Filter by source system

### User Experience

- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages and retry options
- **Empty States**: Helpful messages when no results are found

## 🛠 Tech Stack

- **Framework**: Angular 17
- **UI Library**: Angular Material 17
- **Language**: TypeScript 5.2
- **Styling**: SCSS
- **State Management**: RxJS Observables
- **Routing**: Angular Router with lazy loading
- **Forms**: Angular Reactive Forms
- **HTTP Client**: Angular HttpClient

### Key Dependencies

```json
{
  "@angular/core": "^17.0.0",
  "@angular/material": "^17.0.0",
  "@angular/cdk": "^17.0.0",
  "rxjs": "~7.8.0"
}
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (comes with Node.js)
- **Angular CLI**: v17.x or higher

```bash
# Install Angular CLI globally
npm install -g @angular/cli@17
```

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd super-giggle
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   # Edit src/environments/environment.ts for development
   # Edit src/environments/environment.prod.ts for production
   # See Environment Configuration section below for details
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Open your browser**:
   Navigate to `http://localhost:4200`

## 📁 Project Structure

```
src/
├── app/
│   ├── search/                          # Search feature module
│   │   ├── advanced-search/              # Advanced search component
│   │   │   ├── advanced-search.component.ts
│   │   │   ├── advanced-search.component.html
│   │   │   └── advanced-search.component.scss
│   │   ├── autocomplete/                # Autocomplete component
│   │   ├── featured-results/            # Featured results component
│   │   ├── filter-sidebar/              # Filter sidebar component
│   │   ├── header/                       # Header component
│   │   ├── result-item/                  # Individual result item component
│   │   ├── search-bar/                  # Reusable search bar component
│   │   ├── search-home/                 # Search homepage component
│   │   ├── search-results/              # Search results page component
│   │   ├── search.models.ts             # TypeScript interfaces and types
│   │   ├── search.service.ts            # Search service (API integration)
│   │   ├── search.module.ts             # Feature module
│   │   └── search-routing.module.ts     # Routing configuration
│   ├── app.module.ts                    # Root module
│   ├── app-routing.module.ts            # Root routing
│   └── app.component.ts                 # Root component
├── environments/                         # Environment configuration
│   ├── environment.ts                   # Development environment
│   └── environment.prod.ts              # Production environment
├── styles/
│   ├── _search-theme.scss               # Search-specific theme
│   └── styles.scss                      # Global styles
└── index.html                           # Main HTML file
```

## 💻 Usage

### Basic Search

1. Navigate to the search homepage at `/search`
2. Enter your search query in the search bar
3. Press Enter or click the search button
4. View results on the results page

### Advanced Search

1. Click "Advanced Search" link from the search bar
2. Fill out the advanced search form:
   - **Exact Phrase**: Enter words in quotes for exact matching
   - **All Words**: All words must appear in results
   - **Any Words**: At least one word must appear
   - **None Words**: Exclude results with these words
   - **Field-Specific**: Search within title, author, or content fields
   - **Filters**: Apply file format, content type, and date range filters
3. Click "Search" to execute the query

### Filtering Results

1. On the results page, use the filter sidebar to:
   - Select content types
   - Choose file formats
   - Set date ranges
   - Filter by departments or authors
2. Use the content type tabs (All, News, Video, Images, Sites) to filter by content category
3. Filters are applied immediately and reflected in the URL

### Sorting and Pagination

1. Use the "Sort by" dropdown to change sort order
2. Use the "Per page" selector to change results per page
3. Use the pagination controls at the bottom to navigate between pages

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Build for production with stats
npm run build:prod

# Build with watch mode
npm run watch

# Run unit tests
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code formatting
npm run format:check

# Run security audit
npm run audit
```

### Development Server

The development server runs on `http://localhost:4200` by default. The app will automatically reload if you change any source files.

### Code Structure

- **Components**: Each feature has its own component directory with `.ts`, `.html`, and `.scss` files
- **Services**: Business logic and API calls are in services (e.g., `search.service.ts`)
- **Models**: TypeScript interfaces are defined in `search.models.ts`
- **Routing**: Routes are configured in `search-routing.module.ts`

### Adding New Features

1. Create component files in the appropriate directory
2. Add component to `search.module.ts` declarations
3. Add route in `search-routing.module.ts` if needed
4. Update models in `search.models.ts` if new data structures are needed

## 🔌 API Integration

### API Endpoints

The application expects the following REST API endpoints:

#### Search Endpoint
```
POST /api/search
```

**Request Body:**
```json
{
  "query": "employee benefits",
  "filters": {
    "contentTypes": ["document"],
    "fileFormats": ["PDF"],
    "dateFrom": "2024-01-01T00:00:00Z",
    "dateTo": "2024-12-31T23:59:59Z"
  },
  "sort": "relevance",
  "page": 1,
  "pageSize": 25
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "1",
      "title": "Employee Handbook 2024",
      "snippet": "This handbook contains information about...",
      "source": "HR Documents",
      "author": "John Doe",
      "lastModified": "2024-01-15T00:00:00Z",
      "fileType": "PDF",
      "url": "/documents/employee-handbook-2024.pdf",
      "breadcrumb": ["Company Resources", "HR Documents"],
      "contentType": "document"
    }
  ],
  "featuredResults": [],
  "totalCount": 150,
  "searchTime": 45,
  "query": "employee benefits",
  "page": 1,
  "pageSize": 25,
  "totalPages": 6
}
```

#### Autocomplete Endpoint
```
GET /api/search/autocomplete?q=employee
```

**Response:**
```json
[
  {
    "text": "employee benefits",
    "type": "query",
    "count": 45
  },
  {
    "text": "Employee Handbook",
    "type": "document",
    "count": 12
  }
]
```

#### Trending Searches Endpoint
```
GET /api/search/trending
```

**Response:**
```json
[
  "Employee Benefits",
  "Holiday Schedule 2024",
  "Remote Work Policy"
]
```

### Environment Configuration

Configure your environment in `src/environments/environment.ts` (development) and `src/environments/environment.prod.ts` (production):

```typescript
export const environment = {
  production: boolean,
  apiUrl: string,
  elasticsearch: {
    endpoint: string,
    apiKey?: string,
    username?: string,
    password?: string,
    index: string,
    batchSize: number,
    flushInterval: number
  },
  appVersion: string,
  buildDate: string,
  serviceName: string,
  logLevel: 'debug' | 'info' | 'warn' | 'error'
};
```

**Important**: For production, set Elasticsearch credentials via environment variables:
- `ELASTICSEARCH_ENDPOINT`
- `ELASTICSEARCH_API_KEY` (or `ELASTICSEARCH_USERNAME` and `ELASTICSEARCH_PASSWORD`)
- `ELASTICSEARCH_INDEX`

### Mock Data

The application includes mock data for development and testing. The `SearchService` currently returns mock results. To connect to a real API:

1. Update `search.service.ts` to use `HttpClient` instead of mock data
2. Configure the API URL in `environment.ts`
3. Ensure CORS is properly configured on your API server

## 🧩 Components

### SearchHomeComponent

The landing page for search functionality.

**Features:**
- Prominent search bar
- Trending searches display
- Quick links to frequently accessed resources
- Search tips section

**Route:** `/search`

### SearchBarComponent

Reusable search input component.

**Inputs:**
- `initialQuery`: Initial search query value
- `showHistory`: Show search history dropdown
- `showAdvancedLink`: Show advanced search link
- `placeholder`: Input placeholder text
- `size`: Size variant ('small' | 'medium' | 'large')

**Outputs:**
- `search`: Emitted when search is performed
- `queryChange`: Emitted when query text changes

**Features:**
- Autocomplete integration
- Search history dropdown
- Keyboard navigation
- Clear button

### SearchResultsComponent

Main results display page.

**Features:**
- Results list with pagination
- Content type tabs (All, News, Video, Images, Sites)
- Sorting and filtering controls
- Filter sidebar (collapsible on mobile)
- Empty state handling
- Loading and error states

**Route:** `/search/results`

### AdvancedSearchComponent

Advanced search form.

**Features:**
- Boolean operators (AND, OR, NOT)
- Exact phrase matching
- Field-specific searches
- Date range picker
- File format and content type filters

**Route:** `/search/advanced`

### ResultItemComponent

Individual search result display.

**Features:**
- Title with clickable link
- Snippet with search term highlighting
- Metadata display (source, author, date, file type)
- Breadcrumb navigation
- Thumbnail previews
- Feedback buttons

### FilterSidebarComponent

Filtering interface.

**Features:**
- Content type filters
- File format filters
- Date range picker
- Department and author filters
- Active filters display
- Clear all filters button

### AutocompleteComponent

Autocomplete suggestions dropdown.

**Features:**
- Real-time suggestions
- Keyboard navigation
- Click to select
- Suggestion type indicators

### HeaderComponent

Application header component.

### FeaturedResultsComponent

Featured results display component.

## 🗺 Routing

### Routes

- `/search` - Search homepage
- `/search/results` - Search results page
  - Query params: `q`, `page`, `pageSize`, `sort`, `fileFormats`, `contentTypes`, `dateFrom`, `dateTo`
- `/search/advanced` - Advanced search form

### Route Examples

```
/search/results?q=employee&page=1&pageSize=25&sort=relevance
/search/results?q=benefits&fileFormats=PDF,DOCX&dateFrom=2024-01-01
/search/advanced
```

### Lazy Loading

The search module is lazy-loaded for optimal performance:

```typescript
{
  path: 'search',
  loadChildren: () => import('./search/search.module').then(m => m.SearchModule)
}
```

## 🎨 Styling

### Material Design

The application uses Angular Material for UI components:

- Material Theme: Indigo-Pink (configurable)
- Custom theme overrides in `_search-theme.scss`
- Responsive breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### SCSS Structure

- Global styles in `styles.scss`
- Component-specific styles in component `.scss` files
- Theme customizations in `styles/_search-theme.scss`

### Customization

To customize the theme:

1. Edit `src/styles/_search-theme.scss`
2. Update Material theme variables
3. Add custom component styles

## 🧪 Testing

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --code-coverage
```

### Test Structure

- Unit tests: `*.spec.ts` files alongside components
- Service tests: Test API integration and business logic
- Component tests: Test user interactions and rendering
- Test utilities: Shared mocks and helpers in `src/app/testing/`

### Test Coverage Goals

- Minimum 70% code coverage
- 100% coverage for critical paths (search service, error handling)

### Testing Best Practices

- Test user interactions (clicks, form submissions)
- Test API error handling
- Test loading and empty states
- Test accessibility features
- Use test utilities for common patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Write meaningful commit messages
- Add comments for complex logic
- Maintain test coverage

## 📝 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For issues, questions, or contributions, please contact the development team.

## 🔮 Future Enhancements

Potential future features (out of scope for current version):

- AI-powered answer generation
- Voice search
- Visual search
- Browser extension
- Advanced analytics dashboard
- Personalization based on user role/department
- Saved searches and alerts
- Collaborative filtering
- Search result ranking customization

---

**Built with ❤️ using Angular and Angular Material**
