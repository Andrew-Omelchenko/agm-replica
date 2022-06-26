import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgmrInfoWindowComponent } from './agmr-info-window.component';

describe('AgmrInfoWindowComponent', () => {
  let component: AgmrInfoWindowComponent;
  let fixture: ComponentFixture<AgmrInfoWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgmrInfoWindowComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgmrInfoWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
