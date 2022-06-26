import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgmrSnazzyInfoWindowComponent } from './agmr-snazzy-info-window.component';

describe('AgmrSnazzyInfoWindowComponent', () => {
  let component: AgmrSnazzyInfoWindowComponent;
  let fixture: ComponentFixture<AgmrSnazzyInfoWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgmrSnazzyInfoWindowComponent],
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
