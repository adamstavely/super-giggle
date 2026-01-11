import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

@Injectable({
  providedIn: 'root'
})
export class MobileGesturesService {
  private swipeSubject = new Subject<SwipeEvent>();
  public swipe$: Observable<SwipeEvent> = this.swipeSubject.asObservable();

  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private minSwipeDistance = 50;
  private maxSwipeTime = 500; // milliseconds

  constructor() {
    this.setupTouchListeners();
  }

  private setupTouchListeners(): void {
    document.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = Date.now();
      }
    }, { passive: true });

    document.addEventListener('touchend', (e: TouchEvent) => {
      if (!this.touchStartX || !this.touchStartY) {
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      const deltaTime = touchEndTime - this.touchStartTime;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      if (distance >= this.minSwipeDistance && deltaTime <= this.maxSwipeTime) {
        let direction: 'left' | 'right' | 'up' | 'down';

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        this.swipeSubject.next({
          direction,
          distance,
          velocity
        });
      }

      // Reset
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchStartTime = 0;
    }, { passive: true });
  }

  /**
   * Setup pull-to-refresh on an element
   */
  setupPullToRefresh(element: HTMLElement, onRefresh: () => void): () => void {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullDistance = 0;

    const touchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const touchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;

      if (pullDistance > 0 && element.scrollTop === 0) {
        e.preventDefault();
        // Visual feedback could be added here
      } else {
        isPulling = false;
      }
    };

    const touchEnd = () => {
      if (isPulling && pullDistance > 100) {
        onRefresh();
      }
      isPulling = false;
      pullDistance = 0;
    };

    element.addEventListener('touchstart', touchStart, { passive: false });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', touchEnd, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('touchend', touchEnd);
    };
  }

  /**
   * Setup swipe actions on an element
   */
  setupSwipeActions(
    element: HTMLElement,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void
  ): () => void {
    const subscription = this.swipe$.subscribe((swipe) => {
      const rect = element.getBoundingClientRect();
      const touchPoint = document.elementFromPoint(
        swipe.direction === 'left' || swipe.direction === 'right' 
          ? this.touchStartX 
          : this.touchStartY,
        swipe.direction === 'up' || swipe.direction === 'down'
          ? this.touchStartY
          : this.touchStartX
      );

      if (element.contains(touchPoint)) {
        if (swipe.direction === 'left' && onSwipeLeft) {
          onSwipeLeft();
        } else if (swipe.direction === 'right' && onSwipeRight) {
          onSwipeRight();
        }
      }
    });

    return () => subscription.unsubscribe();
  }
}
