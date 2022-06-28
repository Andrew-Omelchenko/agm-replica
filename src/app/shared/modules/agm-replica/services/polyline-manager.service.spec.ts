import { TestBed } from '@angular/core/testing';

import { PolylineManagerService } from './polyline-manager.service';

describe('PolylineManagerService', () => {
  let service: PolylineManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolylineManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
