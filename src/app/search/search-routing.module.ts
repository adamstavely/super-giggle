import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchHomeComponent } from './search-home/search-home.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { AdvancedSearchComponent } from './advanced-search/advanced-search.component';

const routes: Routes = [
  {
    path: '',
    component: SearchHomeComponent
  },
  {
    path: 'results',
    component: SearchResultsComponent
  },
  {
    path: 'advanced',
    component: AdvancedSearchComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SearchRoutingModule { }
