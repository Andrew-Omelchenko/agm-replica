import { TestBed } from '@angular/core/testing';

import { GoogleMapsApiLoaderService } from './api-loader.service';

describe('ApiLoaderService', () => {
  let service: GoogleMapsApiLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleMapsApiLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
