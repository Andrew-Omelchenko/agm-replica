import {
  AfterContentInit,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { IdGenerator } from '../utils/id-generator';
import { IMVCEvent } from '../utils/mvc-array.utils';
import { AgmrPolylinePoint } from './agmr-polyline-point.directive';
import { AgmrPolylineIcon } from './agmr-polyline-icon.directive';
import { PolylineManagerService } from '../services/polyline-manager.service';

@Directive({
  selector: 'agmr-polyline',
})
// tslint:disable:directive-class-suffix
export class AgmrPolyline implements OnDestroy, OnChanges, AfterContentInit {
  private static polylineOptionsAttributes: string[] = [
    'draggable',
    'editable',
    'visible',
    'geodesic',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'zIndex',
  ];

  /**
   * Indicates whether this Polyline handles mouse events. Defaults to true.
   */
  @Input() clickable = true;

  /**
   * If set to true, the user can drag this shape over the map. The geodesic property defines the
   * mode of dragging. Defaults to false.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('polylineDraggable') draggable = false;

  /**
   * If set to true, the user can edit this shape by dragging the control points shown at the
   * vertices and on each segment. Defaults to false.
   */
  @Input() editable = false;

  /**
   * When true, edges of the polygon are interpreted as geodesic and will follow the curvature of
   * the Earth. When false, edges of the polygon are rendered as straight lines in screen space.
   * Note that the shape of a geodesic polygon may appear to change when dragged, as the dimensions
   * are maintained relative to the surface of the earth. Defaults to false.
   */
  @Input() geodesic = false;

  /**
   * The stroke color. All CSS3 colors are supported except for extended named colors.
   */
  @Input() strokeColor: string | undefined;

  /**
   * The stroke opacity between 0.0 and 1.0.
   */
  @Input() strokeOpacity: number | undefined;

  /**
   * The stroke width in pixels.
   */
  @Input() strokeWeight: number | undefined;

  /**
   * Whether this polyline is visible on the map. Defaults to true.
   */
  @Input() visible = true;

  /**
   * The zIndex compared to other polys.
   */
  @Input() zIndex: number | undefined;

  /**
   * This event is fired when the DOM click event is fired on the Polyline.
   */
  @Output() lineClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the DOM dblclick event is fired on the Polyline.
   */
  @Output() lineDblClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is repeatedly fired while the user drags the polyline.
   */
  @Output() lineDrag: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user stops dragging the polyline.
   */
  @Output() lineDragEnd: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user starts dragging the polyline.
   */
  @Output() lineDragStart: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the DOM mousedown event is fired on the Polyline.
   */
  @Output() lineMouseDown: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the DOM mousemove event is fired on the Polyline.
   */
  @Output() lineMouseMove: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired on Polyline mouseout.
   */
  @Output() lineMouseOut: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired on Polyline mouseover.
   */
  @Output() lineMouseOver: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired whe the DOM mouseup event is fired on the Polyline
   */
  @Output() lineMouseUp: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the Polyline is right-clicked on.
   */
  @Output() lineRightClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired after Polyline's path changes.
   */
  @Output() polyPathChange = new EventEmitter<IMVCEvent<google.maps.LatLng>>();

  /**
   * @internal
   */
  @ContentChildren(AgmrPolylinePoint) public points: QueryList<AgmrPolylinePoint> | undefined;

  @ContentChildren(AgmrPolylineIcon) public iconSequences: QueryList<AgmrPolylineIcon> | undefined;

  private readonly _id: string;
  private polylineAddedToManager = false;
  private subscriptions: Subscription[] = [];

  constructor(private polylineManager: PolylineManagerService) {
    this._id = IdGenerator()
      .next()
      .value.toString();
  }

  /** @internal */
  public ngAfterContentInit(): void {
    if (this.points?.length) {
      this.points.forEach((point: AgmrPolylinePoint) => {
        const s = point.positionChanged.subscribe(() => {
          this.polylineManager.updatePolylinePoints(this);
        });
        this.subscriptions.push(s);
      });
    }
    if (!this.polylineAddedToManager) {
      this.init();
    }
    if (this.points) {
      const pointSub = this.points.changes.subscribe(() => this.polylineManager.updatePolylinePoints(this));
      this.subscriptions.push(pointSub);
    }

    this.polylineManager.updatePolylinePoints(this);

    if (this.iconSequences) {
      const iconSub = this.iconSequences.changes.subscribe(() => this.polylineManager.updateIconSequences(this));
      this.subscriptions.push(iconSub);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.polylineAddedToManager) {
      this.init();
      return;
    }

    const options: { [propName: string]: any } = {};
    const optionKeys = Object.keys(changes).filter((k) => AgmrPolyline.polylineOptionsAttributes.indexOf(k) !== -1);
    optionKeys.forEach((k) => (options[k] = changes[k].currentValue));
    this.polylineManager.setPolylineOptions(this, options);
  }

  /** @internal */
  public ngOnDestroy(): void {
    this.polylineManager.deletePolyline(this);
    // unsubscribe all registered observable subscriptions
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public getPath(): Observable<google.maps.LatLng[] | undefined> {
    return this.polylineManager.getPath(this);
  }

  private init() {
    this.polylineManager.addPolyline(this);
    this.polylineAddedToManager = true;
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const handlers = [
      { name: 'click', handler: (ev: google.maps.PolyMouseEvent) => this.lineClick.emit(ev) },
      { name: 'dblclick', handler: (ev: google.maps.PolyMouseEvent) => this.lineDblClick.emit(ev) },
      { name: 'drag', handler: (ev: google.maps.MapMouseEvent) => this.lineDrag.emit(ev) },
      { name: 'dragend', handler: (ev: google.maps.MapMouseEvent) => this.lineDragEnd.emit(ev) },
      { name: 'dragstart', handler: (ev: google.maps.MapMouseEvent) => this.lineDragStart.emit(ev) },
      { name: 'mousedown', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseDown.emit(ev) },
      { name: 'mousemove', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseMove.emit(ev) },
      { name: 'mouseout', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseOut.emit(ev) },
      { name: 'mouseover', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseOver.emit(ev) },
      { name: 'mouseup', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseUp.emit(ev) },
      { name: 'rightclick', handler: (ev: google.maps.PolyMouseEvent) => this.lineRightClick.emit(ev) },
    ];
    handlers.forEach((obj) => {
      const eventObservable = this.polylineManager.createEventObservable<
        google.maps.PolyMouseEvent | google.maps.MapMouseEvent
      >(obj.name, this);
      if (eventObservable) {
        const os = eventObservable.subscribe(obj.handler as (e: any) => void);
        this.subscriptions.push(os);
      }
    });

    const pathEventObservable = this.polylineManager.createPathEventObservable(this);
    if (pathEventObservable) {
      const os = pathEventObservable.subscribe((pathEvent) => this.polyPathChange.emit(pathEvent));
      this.subscriptions.push(os);
    }
  }

  /** @internal */
  public getPoints(): AgmrPolylinePoint[] {
    if (this.points) {
      return this.points.toArray();
    }
    return [];
  }

  public getIcons(): Array<AgmrPolylineIcon> {
    if (this.iconSequences) {
      return this.iconSequences.toArray();
    }
    return [];
  }

  /** @internal */
  public id(): string {
    return this._id;
  }
}
