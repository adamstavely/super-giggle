import { Component, Input } from '@angular/core';
import { AIAnswer } from '../search.models';

@Component({
  selector: 'app-ai-answer',
  templateUrl: './ai-answer.component.html',
  styleUrls: ['./ai-answer.component.scss']
})
export class AIAnswerComponent {
  @Input() answer: AIAnswer | null = null;
  @Input() showSources: boolean = true;

  get confidencePercentage(): number {
    return this.answer ? Math.round(this.answer.confidence * 100) : 0;
  }

  get confidenceColor(): string {
    if (!this.answer) return 'gray';
    if (this.answer.confidence >= 0.8) return 'green';
    if (this.answer.confidence >= 0.6) return 'orange';
    return 'red';
  }
}
