import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgmrMapComponent } from './agmr-map.component';

describe('AgmrMapComponent', () => {
  let component: AgmrMapComponent;
  let fixture: ComponentFixture<AgmrMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgmrMapComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgmrMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
