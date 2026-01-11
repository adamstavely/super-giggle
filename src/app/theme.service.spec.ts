import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageSpy: jasmine.Spy;
  let matchMediaSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);

    // Mock localStorage
    localStorageSpy = spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');

    // Mock matchMedia
    matchMediaSpy = jasmine.createSpy('matchMedia').and.returnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    } as MediaQueryList);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaSpy
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have darkMode$ observable', () => {
    expect(service.darkMode$).toBeDefined();
  });

  it('should initialize with light theme when no saved preference', () => {
    localStorageSpy.and.returnValue(null);
    matchMediaSpy.and.returnValue({
      matches: false
    } as MediaQueryList);

    const newService = new ThemeService();
    expect(newService.isDarkMode()).toBe(false);
  });

  it('should initialize with saved theme preference', () => {
    localStorageSpy.and.returnValue('dark');
    const newService = new ThemeService();
    expect(newService.isDarkMode()).toBe(true);
  });

  it('should use system preference when no saved preference', () => {
    localStorageSpy.and.returnValue(null);
    matchMediaSpy.and.returnValue({
      matches: true
    } as MediaQueryList);

    const newService = new ThemeService();
    expect(newService.isDarkMode()).toBe(true);
  });

  it('should toggle theme', () => {
    const initialValue = service.isDarkMode();
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(!initialValue);
  });

  it('should set theme explicitly', () => {
    service.setTheme(true);
    expect(service.isDarkMode()).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

    service.setTheme(false);
    expect(service.isDarkMode()).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should apply dark theme class to body', () => {
    service.setTheme(true);
    expect(document.body.classList.add).toHaveBeenCalledWith('dark-theme');
    expect(document.body.classList.remove).toHaveBeenCalledWith('light-theme');
  });

  it('should apply light theme class to body', () => {
    service.setTheme(false);
    expect(document.body.classList.add).toHaveBeenCalledWith('light-theme');
    expect(document.body.classList.remove).toHaveBeenCalledWith('dark-theme');
  });
});
