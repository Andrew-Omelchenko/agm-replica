import { TestBed } from '@angular/core/testing';

import { PolygonManagerService } from './polygon-manager.service';

describe('PolygonManagerService', () => {
  let service: PolygonManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolygonManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
