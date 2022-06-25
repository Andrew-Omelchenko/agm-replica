import { Directive } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';

@Directive({
  selector: 'agmr-map agmr-scale-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrScaleControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrScaleControl extends AgmrMapControl {
  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      scaleControl: true,
    };
  }
}
