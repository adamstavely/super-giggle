import { Component } from '@angular/core';

@Component({
  selector: 'app-search-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  userName = 'User'; // This could come from a user service
  userAvatar = ''; // Avatar URL or initials

  weatherData = {
    temperature: 72,
    condition: 'Sunny',
    icon: 'wb_sunny'
  };

  lunchMenu = {
    today: 'Grilled Chicken Salad',
    available: true
  };

  constructor() {
    // In a real app, these would be fetched from services
    this.loadUserData();
    this.loadWeatherData();
    this.loadLunchMenu();
  }

  private loadUserData(): void {
    // Placeholder - would fetch from user service
    this.userName = 'John Doe';
    this.userAvatar = '';
  }

  private loadWeatherData(): void {
    // Placeholder - would fetch from weather service
    // This could be a real API call
  }

  private loadLunchMenu(): void {
    // Placeholder - would fetch from lunch service
    // This could be a real API call
  }

  onWeatherClick(): void {
    // Handle weather widget click
    console.log('Weather widget clicked');
  }

  onLunchMenuClick(): void {
    // Handle lunch menu click
    console.log('Lunch menu clicked');
  }

  onDirectionsClick(): void {
    // Handle directions click
    console.log('Directions clicked');
  }

  onUserAvatarClick(): void {
    // Handle user avatar click
    console.log('User avatar clicked');
  }
}
