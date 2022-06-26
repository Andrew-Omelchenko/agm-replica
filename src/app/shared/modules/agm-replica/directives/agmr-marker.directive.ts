import { ContentChildren, Directive, EventEmitter, forwardRef, Input, Output, QueryList } from '@angular/core';
import { FitBoundsAccessor } from '../accessors/fit-bounds.accessor';
import { ReplaySubject, Subscription } from 'rxjs';
import { IFitBoundsDetails } from '../models/fit-bounds-details.model';
import { MarkerManagerService } from '../services/marker-manager.service';
import { IdGenerator } from '../utils/id-generator';
import { AgmrInfoWindowComponent } from '../views/agmr-info-window/agmr-info-window.component';

@Directive({
  selector: '[agmr-marker]',
  providers: [{ provide: FitBoundsAccessor, useExisting: forwardRef(() => AgmrMarker) }],
})
// tslint:disable:directive-class-suffix
export class AgmrMarker {
  /**
   * The latitude position of the marker.
   */
  @Input() public latitude: number | undefined;

  /**
   * The longitude position of the marker.
   */
  @Input() public longitude: number | undefined;

  /**
   * The title of the marker.
   */
  @Input() public title: string | undefined;

  /**
   * The label (a single uppercase character) for the marker.
   */
  @Input() public label: string | google.maps.MarkerLabel | undefined;

  /**
   * If true, the marker can be dragged. Default value is false.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('markerDraggable') public draggable = false;

  /**
   * Icon (the URL of the image) for the foreground.
   */
  @Input() public iconUrl: string | google.maps.Icon | google.maps.Symbol | undefined;

  /**
   * If true, the marker is visible
   */
  @Input() public visible = true;

  /**
   * Whether to automatically open the child info window when the marker is clicked.
   */
  @Input() public openInfoWindow = true;

  /**
   * The marker's opacity between 0.0 and 1.0.
   */
  @Input() public opacity = 1;

  /**
   * All markers are displayed on the map in order of their zIndex, with higher values displaying in
   * front of markers with lower values. By default, markers are displayed according to their
   * vertical position on screen, with lower markers appearing in front of markers further up the
   * screen.
   */
  @Input() public zIndex = 1;

  /**
   * If true, the marker can be clicked. Default value is true.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('markerClickable') public clickable = true;

  /**
   * Which animation to play when marker is added to a map.
   * This can be 'BOUNCE' or 'DROP'
   */
  @Input() public animation: keyof typeof google.maps.Animation | undefined;

  /**
   * This event is fired when the marker's animation property changes.
   */
  @Output() public animationChange = new EventEmitter<keyof typeof google.maps.Animation>();

  /**
   * This event emitter gets emitted when the user clicks on the marker.
   */
  @Output() public markerClick: EventEmitter<AgmrMarker> = new EventEmitter<AgmrMarker>();

  /**
   * This event emitter gets emitted when the user clicks twice on the marker.
   */
  @Output() public markerDblClick: EventEmitter<AgmrMarker> = new EventEmitter<AgmrMarker>();

  /**
   * This event is fired when the user right-clicks on the marker.
   */
  @Output() public markerRightClick: EventEmitter<void> = new EventEmitter<void>();

  /**
   * This event is fired when the user starts dragging the marker.
   */
  @Output() public dragStart: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is repeatedly fired while the user drags the marker.
   */
  // tslint:disable-next-line: no-output-native
  @Output() public drag: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user stops dragging the marker.
   */
  @Output() public dragEnd: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user mouses over the marker.
   */
  @Output() public mouseOver: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user mouses outside the marker.
   */
  @Output() public mouseOut: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /** @internal */
  @ContentChildren(AgmrInfoWindowComponent) infoWindow: QueryList<AgmrInfoWindowComponent> = new QueryList<
    AgmrInfoWindowComponent
  >();

  private readonly _id: string;
  private observableSubscriptions: Subscription[] = [];
  private markerAddedToManger = false;

  private readonly fitBoundsDetails$: ReplaySubject<IFitBoundsDetails> = new ReplaySubject<IFitBoundsDetails>(1);

  constructor(private markerManager: MarkerManagerService) {
    this._id = IdGenerator()
      .next()
      .toString();
  }
}
