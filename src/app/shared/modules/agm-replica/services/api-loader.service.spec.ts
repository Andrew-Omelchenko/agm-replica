import { TestBed } from '@angular/core/testing';

import { ApiLoaderService } from './api-loader.service';

describe('ApiLoaderService', () => {
  let service: ApiLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
