import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchRoutingModule } from './search-routing.module';

// Material Modules (already imported in AppModule, but re-importing for feature module)
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';

// Components
import { SearchHomeComponent } from './search-home/search-home.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { AutocompleteComponent } from './autocomplete/autocomplete.component';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { ResultItemComponent } from './result-item/result-item.component';
import { AdvancedSearchComponent } from './advanced-search/advanced-search.component';
import { HeaderComponent } from './header/header.component';
import { FeaturedResultsComponent } from './featured-results/featured-results.component';
import { DocumentPreviewComponent } from './document-preview/document-preview.component';
import { QuickViewPanelComponent } from './quick-view-panel/quick-view-panel.component';

@NgModule({
  declarations: [
    SearchHomeComponent,
    SearchResultsComponent,
    SearchBarComponent,
    AutocompleteComponent,
    FilterSidebarComponent,
    ResultItemComponent,
    AdvancedSearchComponent,
    HeaderComponent,
    FeaturedResultsComponent,
    DocumentPreviewComponent,
    QuickViewPanelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SearchRoutingModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatListModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule
  ],
  providers: []
})
export class SearchModule { }
