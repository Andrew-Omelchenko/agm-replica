import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgmrSnazzyInfoWindowComponent } from './agmr-snazzy-info-window.component';
import { GoogleMapsApiService } from '@app/shared/modules/agm-replica/services/google-maps-api.service';
import { MarkerManagerService } from '@app/shared/modules/agm-replica/services/marker-manager.service';
import { NEVER } from 'rxjs';

describe('AgmrSnazzyInfoWindowComponent', () => {
  let component: AgmrSnazzyInfoWindowComponent;
  let fixture: ComponentFixture<AgmrSnazzyInfoWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgmrSnazzyInfoWindowComponent],
      providers: [
        {
          provide: GoogleMapsApiService,
          useValue: {
            getNativeMap: jasmine.createSpy('getNativeMap').and.returnValue(NEVER),
          },
        },
        {
          provide: MarkerManagerService,
          useValue: {
            getNativeMarker: jasmine.createSpy('getNativeMarker'),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgmrSnazzyInfoWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
