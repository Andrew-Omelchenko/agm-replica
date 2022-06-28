import { Directive, EventEmitter, forwardRef, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { FitBoundsAccessor } from '../accessors/fit-bounds.accessor';
import { IFitBoundsDetails } from '../models/fit-bounds-details.model';

@Directive({
  selector: 'agmr-polyline-point',
  providers: [{ provide: FitBoundsAccessor, useExisting: forwardRef(() => AgmrPolylinePoint) }],
})
// tslint:disable:directive-class-suffix
export class AgmrPolylinePoint implements OnChanges, FitBoundsAccessor {
  /**
   * The latitude position of the point.
   */
  @Input() public latitude: number | undefined;

  /**
   * The longitude position of the point;
   */
  @Input() public longitude: number | undefined;

  /**
   * This event emitter gets emitted when the position of the point changed.
   */
  @Output() public positionChanged: EventEmitter<google.maps.LatLngLiteral> = new EventEmitter<
    google.maps.LatLngLiteral
  >();

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.latitude || changes.longitude) {
      this.positionChanged.emit({
        lat: changes.latitude?.currentValue || this.latitude,
        lng: changes.longitude?.currentValue || this.longitude,
      });
    }
  }

  /** @internal */
  public getFitBoundsDetails$(): Observable<IFitBoundsDetails> {
    return this.positionChanged.pipe(
      startWith({ lat: this.latitude || 0, lng: this.longitude || 0 }),
      map((position) => ({ latLng: position })),
    );
  }
}
