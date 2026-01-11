import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export class MockActivatedRoute {
  private queryParamsSubject = new BehaviorSubject<any>({});
  queryParams = this.queryParamsSubject.asObservable();
  
  snapshot = {
    queryParams: {},
    params: {},
    url: []
  };

  setQueryParams(params: any): void {
    this.queryParamsSubject.next(params);
    this.snapshot.queryParams = params;
  }
}

export function provideMockActivatedRoute(): { provide: typeof ActivatedRoute; useClass: typeof MockActivatedRoute } {
  return {
    provide: ActivatedRoute,
    useClass: MockActivatedRoute
  };
}
