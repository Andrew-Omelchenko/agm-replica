import {
  AfterContentInit,
  ContentChildren,
  Directive,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChange,
} from '@angular/core';
import { FitBoundsAccessor } from '../accessors/fit-bounds.accessor';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { IFitBoundsDetails } from '../models/fit-bounds-details.model';
import { MarkerManagerService } from '../services/marker-manager.service';
import { IdGenerator } from '../utils/id-generator';
import { AgmrInfoWindowComponent } from '../views/agmr-info-window/agmr-info-window.component';

@Directive({
  selector: 'agmr-marker',
  providers: [{ provide: FitBoundsAccessor, useExisting: forwardRef(() => AgmrMarker) }],
})
// tslint:disable:directive-class-suffix
export class AgmrMarker implements OnDestroy, OnChanges, AfterContentInit, FitBoundsAccessor {
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
  @Output() public markerDblClick: EventEmitter<AgmrMarker | null> = new EventEmitter<AgmrMarker | null>();

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
  private markerAddedToManager = false;

  private readonly fitBoundsDetails$: ReplaySubject<IFitBoundsDetails> = new ReplaySubject<IFitBoundsDetails>(1);

  constructor(private markerManager: MarkerManagerService) {
    this._id = IdGenerator()
      .next()
      .value.toString();
  }

  /* @internal */
  public ngAfterContentInit(): void {
    this.handleInfoWindowUpdate();
    this.infoWindow.changes.subscribe(() => this.handleInfoWindowUpdate());
  }

  /** @internal */
  public ngOnChanges(changes: { [key: string]: SimpleChange }): void {
    if (typeof this.latitude === 'string') {
      this.latitude = Number(this.latitude);
    }
    if (typeof this.longitude === 'string') {
      this.longitude = Number(this.longitude);
    }
    if (typeof this.latitude !== 'number' || typeof this.longitude !== 'number') {
      return;
    }
    if (!this.markerAddedToManager) {
      this.markerManager.addMarker(this);
      this.updateFitBoundsDetails();
      this.markerAddedToManager = true;
      this.addEventListeners();
      return;
    }
    if (changes['latitude'] || changes['longitude']) {
      this.markerManager.updateMarkerPosition(this);
      this.updateFitBoundsDetails();
    }
    if (changes['title']) {
      this.markerManager.updateTitle(this);
    }
    if (changes['label']) {
      this.markerManager.updateLabel(this);
    }
    if (changes['draggable']) {
      this.markerManager.updateDraggable(this);
    }
    if (changes['iconUrl']) {
      this.markerManager.updateIcon(this);
    }
    if (changes['opacity']) {
      this.markerManager.updateOpacity(this);
    }
    if (changes['visible']) {
      this.markerManager.updateVisible(this);
    }
    if (changes['zIndex']) {
      this.markerManager.updateZIndex(this);
    }
    if (changes['clickable']) {
      this.markerManager.updateClickable(this);
    }
    if (changes['animation']) {
      this.markerManager.updateAnimation(this);
    }
  }

  /** @internal */
  public ngOnDestroy(): void {
    this.markerManager.deleteMarker(this);
    // unsubscribe all registered observable subscriptions
    this.observableSubscriptions.forEach((s) => s.unsubscribe());
  }

  private handleInfoWindowUpdate(): void {
    if (this.infoWindow.length > 1) {
      throw new Error('Expected no more than one info window.');
    }
    this.infoWindow.forEach((marker) => {
      marker.hostMarker = this;
    });
  }

  /** @internal */
  public getFitBoundsDetails$(): Observable<IFitBoundsDetails> {
    return this.fitBoundsDetails$.asObservable();
  }

  protected updateFitBoundsDetails(): void {
    if (typeof this.latitude === 'number' && typeof this.longitude === 'number') {
      this.fitBoundsDetails$.next({ latLng: { lat: this.latitude, lng: this.longitude } });
    }
  }

  private addEventListeners(): void {
    const cs = this.markerManager.createEventObservable('click', this).subscribe(() => {
      if (this.openInfoWindow) {
        this.infoWindow.forEach((infoWindow) => infoWindow.open());
      }
      this.markerClick.emit(this);
    });
    this.observableSubscriptions.push(cs);

    const dcs = this.markerManager.createEventObservable<google.maps.MapMouseEvent>('dblclick', this).subscribe(() => {
      this.markerDblClick.emit();
    });
    this.observableSubscriptions.push(dcs);

    const rc = this.markerManager.createEventObservable<google.maps.MapMouseEvent>('rightclick', this).subscribe(() => {
      this.markerRightClick.emit();
    });
    this.observableSubscriptions.push(rc);

    const ds = this.markerManager.createEventObservable<google.maps.MapMouseEvent>('dragstart', this).subscribe((e) => {
      this.dragStart.emit(e);
    });
    this.observableSubscriptions.push(ds);

    const d = this.markerManager.createEventObservable<google.maps.MapMouseEvent>('drag', this).subscribe((e) => {
      this.drag.emit(e);
    });
    this.observableSubscriptions.push(d);

    const de = this.markerManager.createEventObservable<google.maps.MapMouseEvent>('dragend', this).subscribe((e) => {
      this.dragEnd.emit(e);
    });
    this.observableSubscriptions.push(de);

    const mover = this.markerManager
      .createEventObservable<google.maps.MapMouseEvent>('mouseover', this)
      .subscribe((e) => {
        this.mouseOver.emit(e);
      });
    this.observableSubscriptions.push(mover);

    const mout = this.markerManager
      .createEventObservable<google.maps.MapMouseEvent>('mouseout', this)
      .subscribe((e) => {
        this.mouseOut.emit(e);
      });
    this.observableSubscriptions.push(mout);

    const anChng = this.markerManager.createEventObservable<void>('animation_changed', this).subscribe(() => {
      this.animationChange.emit(this.animation);
    });
    this.observableSubscriptions.push(anChng);
  }

  /** @internal */
  public id(): string {
    return this._id;
  }

  /** @internal */
  public toString(): string {
    return 'AgmrMarker-' + this._id;
  }
}
