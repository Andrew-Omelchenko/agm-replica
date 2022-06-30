import { Directive, Input } from '@angular/core';

@Directive()
// tslint:disable:directive-class-suffix
export abstract class AgmrMapControl {
  @Input() public position: google.maps.ControlPosition | undefined;
  public abstract getOptions(): Partial<google.maps.MapOptions>;
}
