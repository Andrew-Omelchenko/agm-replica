import { TestBed } from '@angular/core/testing';

import { CircleManagerService } from './circle-manager.service';

describe('CircleManagerService', () => {
  let service: CircleManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CircleManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
