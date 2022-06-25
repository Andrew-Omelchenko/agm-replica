import { Directive } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';
import ControlPosition = google.maps.ControlPosition;

@Directive({
  selector: 'agmr-map agmr-street-view-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrStreetViewControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrStreetViewControl extends AgmrMapControl {
  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      streetViewControl: true,
      streetViewControlOptions: {
        position:
          this.position && ((google.maps.ControlPosition[this.position] as unknown) as ControlPosition | undefined),
      },
    };
  }
}
