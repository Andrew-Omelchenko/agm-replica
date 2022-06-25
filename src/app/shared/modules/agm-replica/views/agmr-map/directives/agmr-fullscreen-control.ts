import { Directive } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';
import ControlPosition = google.maps.ControlPosition;

@Directive({
  selector: 'agmr-map agmr-fullscreen-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrFullscreenControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrFullscreenControl extends AgmrMapControl {
  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: this.position && ((ControlPosition[this.position] as unknown) as ControlPosition | undefined),
      },
    };
  }
}
