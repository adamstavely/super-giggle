import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  templateUrl: './loading-skeleton.component.html',
  styleUrls: ['./loading-skeleton.component.scss']
})
export class LoadingSkeletonComponent {
  @Input() type: 'result-item' | 'search-bar' | 'filter' | 'list' = 'result-item';
  @Input() count: number = 3;
  @Input() showHeader: boolean = false;

  get items(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
