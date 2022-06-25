import { Directive } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';

@Directive({
  selector: 'agmr-map agmr-rotate-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrRotateControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrRotateControl extends AgmrMapControl {
  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      rotateControl: true,
      rotateControlOptions: {
        position:
          this.position &&
          ((google.maps.ControlPosition[this.position] as unknown) as google.maps.ControlPosition | undefined),
      },
    };
  }
}
