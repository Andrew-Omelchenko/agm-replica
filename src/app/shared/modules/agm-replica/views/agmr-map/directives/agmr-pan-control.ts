import { Directive } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';
import ControlPosition = google.maps.ControlPosition;

@Directive({
  selector: 'agmr-map agmr-pan-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrPanControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrPanControl extends AgmrMapControl {
  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      panControl: true,
      panControlOptions: {
        position: this.position && ((ControlPosition[this.position] as unknown) as ControlPosition | undefined),
      },
    };
  }
}
