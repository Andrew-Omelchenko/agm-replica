import { Directive, Input } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';

@Directive({
  selector: 'agmr-map agmr-map-type-control',
  providers: [{ provide: AgmrMapControl, useExisting: AgmrMapTypeControl }],
})
// tslint:disable:directive-class-suffix
export class AgmrMapTypeControl extends AgmrMapControl {
  @Input() mapTypeIds: (keyof typeof google.maps.MapTypeId)[] | undefined;
  @Input() style: keyof typeof google.maps.MapTypeControlStyle | undefined;

  public getOptions(): Partial<google.maps.MapOptions> {
    return {
      mapTypeControl: true,
      mapTypeControlOptions: {
        position:
          this.position &&
          ((google.maps.ControlPosition[this.position] as unknown) as google.maps.ControlPosition | undefined),
        style: this.style && google.maps.MapTypeControlStyle[this.style],
        mapTypeIds: this.mapTypeIds && this.mapTypeIds.map((mapTypeId) => google.maps.MapTypeId[mapTypeId]),
      },
    };
  }
}
