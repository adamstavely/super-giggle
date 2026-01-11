import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

export function getHttpTestingController(): HttpTestingController {
  return TestBed.inject(HttpTestingController);
}

export { HttpClientTestingModule };
