import { Directive, Input, OnChanges, OnDestroy, OnInit, Self } from '@angular/core';
import { Subject } from 'rxjs';
import { IFitBoundsDetails } from '../models/fit-bounds-details.model';
import { FitBoundsAccessor } from '../accessors/fit-bounds.accessor';
import { FitBoundsService } from '../services/fit-bounds.service';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';

@Directive({
  selector: '[agmrFitBounds]',
})
// tslint:disable:directive-class-suffix
export class AgmrFitBounds implements OnInit, OnDestroy, OnChanges {
  /**
   * If the value is true, the element gets added to the bounds of the map.
   * Default: true.
   */
  @Input() public agmrFitBounds = true;

  private destroyed$: Subject<void> = new Subject<void>();
  private latestFitBoundsDetails: IFitBoundsDetails | null = null;

  constructor(
    @Self() private readonly fitBoundsAccessor: FitBoundsAccessor,
    private readonly fitBoundsService: FitBoundsService,
  ) {}

  /**
   * @internal
   */
  public ngOnChanges(): void {
    this.updateBounds();
  }

  /**
   * @internal
   */
  public ngOnInit(): void {
    this.fitBoundsAccessor
      .getFitBoundsDetails$()
      .pipe(
        distinctUntilChanged(
          (x: IFitBoundsDetails, y: IFitBoundsDetails) =>
            x.latLng.lat === y.latLng.lat && x.latLng.lng === y.latLng.lng,
        ),
        tap(console.log),
        takeUntil(this.destroyed$),
      )
      .subscribe((details) => this.updateBounds(details));
  }

  /**
   * @internal
   */
  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    if (this.latestFitBoundsDetails !== null) {
      this.fitBoundsService.removeFromBounds(this.latestFitBoundsDetails.latLng);
    }
  }

  /*
   Either the location changed, or visible status changed.
   Possible state changes are
   invisible -> visible
   visible -> invisible
   visible -> visible (new location)
  */
  private updateBounds(newFitBoundsDetails?: IFitBoundsDetails) {
    // either visibility will change, or location, so remove the old one anyway
    if (this.latestFitBoundsDetails) {
      this.fitBoundsService.removeFromBounds(this.latestFitBoundsDetails.latLng);
      // don't set latestFitBoundsDetails to null, because we can toggle visibility from
      // true -> false -> true, in which case we still need old value cached here
    }

    if (newFitBoundsDetails) {
      this.latestFitBoundsDetails = newFitBoundsDetails;
    }
    if (!this.latestFitBoundsDetails) {
      return;
    }
    if (this.agmrFitBounds) {
      this.fitBoundsService.addToBounds(this.latestFitBoundsDetails.latLng);
    }
  }
}
