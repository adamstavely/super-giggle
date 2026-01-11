import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RecommendationService } from '../../core/services/recommendation.service';
import { FeaturedResultRecommendation, SearchResult } from '../search.models';

export interface RecommendationModalData {
  searchQuery: string;
  searchResults?: SearchResult[];
}

@Component({
  selector: 'app-recommendation-modal',
  templateUrl: './recommendation-modal.component.html',
  styleUrls: ['./recommendation-modal.component.scss']
})
export class RecommendationModalComponent implements OnInit {
  recommendationForm: FormGroup;
  searchQuery: string;
  searchResults: SearchResult[];
  selectedResult: SearchResult | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecommendationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecommendationModalData,
    private recommendationService: RecommendationService
  ) {
    this.searchQuery = data.searchQuery || '';
    this.searchResults = data.searchResults || [];
    
    this.recommendationForm = this.fb.group({
      resultTitle: ['', Validators.required],
      resultUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      employeeName: ['', Validators.required],
      employeeEmail: ['', [Validators.required, Validators.email]],
      employeeDepartment: ['']
    });
  }

  ngOnInit(): void {
    // If there are search results, pre-select first result
    if (this.searchResults.length > 0) {
      this.selectResult(this.searchResults[0]);
    }
  }

  selectResult(result: SearchResult): void {
    this.selectedResult = result;
    this.recommendationForm.patchValue({
      resultTitle: result.title,
      resultUrl: result.url
    });
  }

  onResultSelectChange(event: any): void {
    const selectedId = event.value;
    const result = this.searchResults.find(r => r.id === selectedId);
    if (result) {
      this.selectResult(result);
    }
  }

  onSubmit(): void {
    if (this.recommendationForm.valid) {
      this.loading = true;
      
      const formValue = this.recommendationForm.value;
      
      // Create a result object from form data or use selected result
      const recommendedResult: SearchResult = this.selectedResult 
        ? {
            ...this.selectedResult,
            title: formValue.resultTitle,
            url: formValue.resultUrl
          }
        : {
            id: `manual-${Date.now()}`,
            title: formValue.resultTitle,
            url: formValue.resultUrl,
            snippet: '',
            source: 'Manual Entry',
            author: formValue.employeeName,
            lastModified: new Date(),
            fileType: 'HTML'
          };
      
      const recommendation: FeaturedResultRecommendation = {
        searchQuery: this.searchQuery,
        recommendedResult: recommendedResult,
        reason: formValue.reason,
        employeeName: formValue.employeeName,
        employeeEmail: formValue.employeeEmail,
        employeeDepartment: formValue.employeeDepartment || undefined,
        timestamp: new Date()
      };

      this.recommendationService.submitRecommendation(recommendation).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.recommendationForm.controls).forEach(key => {
        this.recommendationForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.recommendationForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (control?.hasError('minlength')) {
      return 'Please provide more details (at least 10 characters)';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      resultTitle: 'Result Title',
      resultUrl: 'Result URL',
      reason: 'Reason',
      employeeName: 'Your Name',
      employeeEmail: 'Your Email',
      employeeDepartment: 'Department'
    };
    return labels[fieldName] || fieldName;
  }
}
