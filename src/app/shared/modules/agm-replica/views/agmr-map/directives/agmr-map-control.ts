import { Directive, Input } from '@angular/core';
import ControlPosition = google.maps.ControlPosition;

@Directive()
// tslint:disable:directive-class-suffix
export abstract class AgmrMapControl {
  @Input() public position: ControlPosition | undefined;
  public abstract getOptions(): Partial<google.maps.MapOptions>;
}
