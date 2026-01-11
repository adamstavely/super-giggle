import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  country?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private cachedLocation: LocationInfo | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamp = 0;

  /**
   * Check if geolocation is available
   */
  isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current location
   */
  getCurrentLocation(useCache: boolean = true): Observable<LocationInfo> {
    if (!this.isGeolocationAvailable()) {
      return throwError(() => new Error('Geolocation not available'));
    }

    // Return cached location if still valid
    if (useCache && this.cachedLocation && (Date.now() - this.cacheTimestamp) < this.cacheExpiry) {
      return of(this.cachedLocation);
    }

    return from(
      new Promise<LocationInfo>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: LocationInfo = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };

            this.cachedLocation = location;
            this.cacheTimestamp = Date.now();

            // Optionally reverse geocode to get address
            this.reverseGeocode(location.latitude, location.longitude)
              .subscribe({
                next: (address) => {
                  location.address = address.address;
                  location.city = address.city;
                  location.country = address.country;
                  this.cachedLocation = location;
                  resolve(location);
                },
                error: () => {
                  // If reverse geocoding fails, still return location
                  resolve(location);
                }
              });
          },
          (error) => {
            reject(new Error(`Geolocation error: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      })
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Watch location changes
   */
  watchLocation(): Observable<LocationInfo> {
    if (!this.isGeolocationAvailable()) {
      return throwError(() => new Error('Geolocation not available'));
    }

    return new Observable(observer => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: LocationInfo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          observer.next(location);
        },
        (error) => {
          observer.error(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  calculateDistance(loc1: LocationInfo, loc2: LocationInfo): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.latitude)) *
        Math.cos(this.toRad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  /**
   * Reverse geocode coordinates to address
   */
  private reverseGeocode(lat: number, lon: number): Observable<{ address: string; city: string; country: string }> {
    // This would typically use a geocoding API like Google Maps, Mapbox, etc.
    // For now, return a mock that would need backend integration
    return throwError(() => new Error('Reverse geocoding requires API integration'));
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear cached location
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
  }
}
