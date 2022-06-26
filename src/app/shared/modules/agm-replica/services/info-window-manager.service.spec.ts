import { TestBed } from '@angular/core/testing';

import { InfoWindowManagerService } from './info-window-manager.service';

describe('InfoWindowManagerService', () => {
  let service: InfoWindowManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfoWindowManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
