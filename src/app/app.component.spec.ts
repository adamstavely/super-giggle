import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ThemeService } from './theme.service';
import { BehaviorSubject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let themeService: jasmine.SpyObj<ThemeService>;
  let darkModeSubject: BehaviorSubject<boolean>;

  beforeEach(() => {
    darkModeSubject = new BehaviorSubject<boolean>(false);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      darkMode$: darkModeSubject.asObservable()
    });

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    });

    component = TestBed.createComponent(AppComponent).componentInstance;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have title "Intranet Search"', () => {
    expect(component.title).toBe('Intranet Search');
  });

  it('should initialize isDarkMode to false', () => {
    expect(component.isDarkMode).toBe(false);
  });

  it('should subscribe to theme changes', () => {
    darkModeSubject.next(true);
    expect(component.isDarkMode).toBe(true);

    darkModeSubject.next(false);
    expect(component.isDarkMode).toBe(false);
  });

  it('should call themeService.toggleTheme when toggleTheme is called', () => {
    component.toggleTheme();
    expect(themeService.toggleTheme).toHaveBeenCalled();
  });
});
