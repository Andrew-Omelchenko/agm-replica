import { Directive, Input } from '@angular/core';
import { AgmrMapControl } from './agmr-map-control';
import ControlPosition = google.maps.ControlPosition;

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
        position: this.position && ((ControlPosition[this.position] as unknown) as ControlPosition | undefined),
        style: this.style && google.maps.MapTypeControlStyle[this.style],
        mapTypeIds: this.mapTypeIds && this.mapTypeIds.map((mapTypeId) => google.maps.MapTypeId[mapTypeId]),
      },
    };
  }
}
