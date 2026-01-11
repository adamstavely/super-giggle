import { Router } from '@angular/router';
import { of } from 'rxjs';

export class MockRouter {
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
  navigateByUrl = jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true));
  url = '/test';
  events = of({});
  routerState = {
    snapshot: {
      url: '/test',
      root: {} as any
    }
  };
}

export function provideMockRouter(): { provide: typeof Router; useClass: typeof MockRouter } {
  return {
    provide: Router,
    useClass: MockRouter
  };
}
