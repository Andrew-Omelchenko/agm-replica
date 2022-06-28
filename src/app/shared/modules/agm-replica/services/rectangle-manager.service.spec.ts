import { TestBed } from '@angular/core/testing';

import { RectangleManagerService } from './rectangle-manager.service';

describe('RectangleManagerService', () => {
  let service: RectangleManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RectangleManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
