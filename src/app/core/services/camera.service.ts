import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CameraResult {
  imageData: string; // Base64 or data URL
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private mediaStream: MediaStream | null = null;

  /**
   * Check if camera is available
   */
  isCameraAvailable(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Capture photo from camera
   */
  capturePhoto(constraints: MediaStreamConstraints = { video: true }): Observable<CameraResult> {
    if (!this.isCameraAvailable()) {
      return throwError(() => new Error('Camera not available'));
    }

    return from(
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        this.mediaStream = stream;
        return this.takePhoto(stream);
      })
    ).pipe(
      catchError(error => {
        this.stopCamera();
        return throwError(() => error);
      })
    );
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Scan QR code from image
   */
  scanQRCode(imageData: string): Observable<string> {
    // This would typically use a QR code library like jsQR
    // For now, return an observable that would need to be implemented with a library
    return throwError(() => new Error('QR code scanning requires jsQR library'));
  }

  /**
   * Process image for visual search
   */
  processImageForSearch(imageData: string): Observable<{ features: number[] }> {
    // This would typically send the image to a backend service for feature extraction
    // For now, return a mock response
    return throwError(() => new Error('Visual search requires backend integration'));
  }

  private takePhoto(stream: MediaStream): Promise<CameraResult> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Stop video tracks
        stream.getTracks().forEach(track => track.stop());

        resolve({
          imageData,
          width: canvas.width,
          height: canvas.height
        });
      };

      video.onerror = (error) => {
        reject(error);
      };
    });
  }
}
