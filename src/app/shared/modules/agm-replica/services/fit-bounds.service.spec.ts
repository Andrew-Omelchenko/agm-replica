import { TestBed } from '@angular/core/testing';

import { FitBoundsService } from './fit-bounds.service';

describe('FitBoundsService', () => {
  let service: FitBoundsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FitBoundsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
