import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent]
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default user name', () => {
    expect(component.userName).toBeDefined();
  });

  it('should have weather data', () => {
    expect(component.weatherData).toBeDefined();
    expect(component.weatherData.temperature).toBeDefined();
    expect(component.weatherData.condition).toBeDefined();
  });

  it('should have lunch menu data', () => {
    expect(component.lunchMenu).toBeDefined();
    expect(component.lunchMenu.today).toBeDefined();
  });

  it('should handle weather click', () => {
    spyOn(console, 'log');
    component.onWeatherClick();
    expect(console.log).toHaveBeenCalledWith('Weather widget clicked');
  });

  it('should handle lunch menu click', () => {
    spyOn(console, 'log');
    component.onLunchMenuClick();
    expect(console.log).toHaveBeenCalledWith('Lunch menu clicked');
  });

  it('should handle directions click', () => {
    spyOn(console, 'log');
    component.onDirectionsClick();
    expect(console.log).toHaveBeenCalledWith('Directions clicked');
  });

  it('should handle user avatar click', () => {
    spyOn(console, 'log');
    component.onUserAvatarClick();
    expect(console.log).toHaveBeenCalledWith('User avatar clicked');
  });
});
