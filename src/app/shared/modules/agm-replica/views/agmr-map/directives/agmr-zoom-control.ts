import { Directive, Input } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';

@Directive({
  selector: 'agmr-map agmr-zoom-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrZoomControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrZoomControl extends AgmrMapControl {
  @Input() style: keyof typeof google.maps.ZoomControlStyle | undefined;
  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      zoomControl: true,
      zoomControlOptions: {
        position:
          this.position &&
          ((google.maps.ControlPosition[this.position] as unknown) as google.maps.ControlPosition | undefined),
        style: this.style && google.maps.ZoomControlStyle[this.style],
      },
    };
  }
}
