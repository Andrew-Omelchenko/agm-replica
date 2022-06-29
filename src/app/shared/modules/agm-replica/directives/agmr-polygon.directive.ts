import {
  AfterContentInit,
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { IMVCEvent } from '../utils/mvc-array.utils';
import { Observable, Subscription } from 'rxjs';
import { PolygonManagerService } from '../services/polygon-manager.service';
import { IdGenerator } from '../utils/id-generator';

@Directive({
  selector: 'agmr-polygon',
})
// tslint:disable:directive-class-suffix
export class AgmrPolygon implements OnDestroy, OnChanges, AfterContentInit {
  private static polygonOptionsAttributes: string[] = [
    'clickable',
    'draggable',
    'editable',
    'fillColor',
    'fillOpacity',
    'geodesic',
    'icon',
    'map',
    'paths',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible',
    'zIndex',
    'draggable',
    'editable',
    'visible',
  ];

  /**
   * Indicates whether this Polygon handles mouse events. Defaults to true.
   */
  @Input() public clickable = true;

  /**
   * If set to true, the user can drag this shape over the map. The geodesic
   * property defines the mode of dragging. Defaults to false.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('polyDraggable') public draggable = false;

  /**
   * If set to true, the user can edit this shape by dragging the control
   * points shown at the vertices and on each segment. Defaults to false.
   */
  @Input() public editable = false;

  /**
   * The fill color. All CSS3 colors are supported except for extended
   * named colors.
   */
  @Input() public fillColor: string | undefined;

  /**
   * The fill opacity between 0.0 and 1.0
   */
  @Input() public fillOpacity: number | undefined;

  /**
   * When true, edges of the polygon are interpreted as geodesic and will
   * follow the curvature of the Earth. When false, edges of the polygon are
   * rendered as straight lines in screen space. Note that the shape of a
   * geodesic polygon may appear to change when dragged, as the dimensions
   * are maintained relative to the surface of the earth. Defaults to false.
   */
  @Input() public geodesic = false;

  /**
   * The ordered sequence of coordinates that designates a closed loop.
   * Unlike polylines, a polygon may consist of one or more paths.
   *  As a result, the paths property may specify one or more arrays of
   * LatLng coordinates. Paths are closed automatically; do not repeat the
   * first vertex of the path as the last vertex. Simple polygons may be
   * defined using a single array of LatLngs. More complex polygons may
   * specify an array of arrays. Any simple arrays are converted into Arrays.
   * Inserting or removing LatLngs from the Array will automatically update
   * the polygon on the map.
   */
  @Input() public paths:
    | google.maps.LatLng[]
    | google.maps.LatLng[][]
    | google.maps.MVCArray<google.maps.LatLng>
    | google.maps.MVCArray<google.maps.MVCArray<google.maps.LatLng>>
    | google.maps.LatLngLiteral[]
    | google.maps.LatLngLiteral[][] = [];

  /**
   * The stroke color. All CSS3 colors are supported except for extended
   * named colors.
   */
  @Input() public strokeColor: string | undefined;

  /**
   * The stroke opacity between 0.0 and 1.0
   */
  @Input() public strokeOpacity: number | undefined;

  /**
   * The stroke width in pixels.
   */
  @Input() public strokeWeight: number | undefined;

  /**
   * Whether this polygon is visible on the map. Defaults to true.
   */
  @Input() public visible: boolean | undefined;

  /**
   * The zIndex compared to other polys.
   */
  @Input() public zIndex: number | undefined;

  /**
   * This event is fired when the DOM click event is fired on the Polygon.
   */
  @Output() public polyClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the DOM dblclick event is fired on the Polygon.
   */
  @Output() public polyDblClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is repeatedly fired while the user drags the polygon.
   */
  @Output() public polyDrag: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user stops dragging the polygon.
   */
  @Output() public polyDragEnd: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user starts dragging the polygon.
   */
  @Output() public polyDragStart: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<
    google.maps.MapMouseEvent
  >();

  /**
   * This event is fired when the DOM mousedown event is fired on the Polygon.
   */
  @Output() public polyMouseDown: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is fired when the DOM mousemove event is fired on the Polygon.
   */
  @Output() public polyMouseMove: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is fired on Polygon mouseout.
   */
  @Output() public polyMouseOut: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is fired on Polygon mouseover.
   */
  @Output() public polyMouseOver: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is fired whe the DOM mouseup event is fired on the Polygon
   */
  @Output() public polyMouseUp: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is fired when the Polygon is right-clicked on.
   */
  @Output() public polyRightClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<
    google.maps.PolyMouseEvent
  >();

  /**
   * This event is fired after Polygon first path changes.
   */
  @Output() public polyPathsChange = new EventEmitter<IMVCEvent<google.maps.LatLng[] | google.maps.LatLngLiteral[]>>();

  private _id: string;
  private polygonAddedToManager = false;
  private subscriptions: Subscription[] = [];

  constructor(private polygonManager: PolygonManagerService) {
    this._id = IdGenerator()
      .next()
      .value.toString();
  }

  /** @internal */
  public ngAfterContentInit(): void {
    if (!this.polygonAddedToManager) {
      this.init();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.polygonAddedToManager) {
      this.init();
      return;
    }
    this.polygonManager.setPolygonOptions(this, this.updatePolygonOptions(changes));
  }

  /** @internal */
  public ngOnDestroy(): void {
    this.polygonManager.deletePolygon(this);
    // unsubscribe all registered observable subscriptions
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  public getPath(): Observable<google.maps.LatLng[] | undefined> {
    return this.polygonManager.getPath(this);
  }

  public getPaths(): Observable<google.maps.LatLng[][] | undefined> {
    return this.polygonManager.getPaths(this);
  }

  /** @internal */
  public id(): string {
    return this._id;
  }

  private init() {
    this.polygonManager.addPolygon(this);
    this.polygonAddedToManager = true;
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const handlers = [
      { name: 'click', handler: (ev: google.maps.PolyMouseEvent) => this.polyClick.emit(ev) },
      { name: 'dblclick', handler: (ev: google.maps.PolyMouseEvent) => this.polyDblClick.emit(ev) },
      { name: 'drag', handler: (ev: google.maps.MapMouseEvent) => this.polyDrag.emit(ev) },
      { name: 'dragend', handler: (ev: google.maps.MapMouseEvent) => this.polyDragEnd.emit(ev) },
      { name: 'dragstart', handler: (ev: google.maps.MapMouseEvent) => this.polyDragStart.emit(ev) },
      { name: 'mousedown', handler: (ev: google.maps.PolyMouseEvent) => this.polyMouseDown.emit(ev) },
      { name: 'mousemove', handler: (ev: google.maps.PolyMouseEvent) => this.polyMouseMove.emit(ev) },
      { name: 'mouseout', handler: (ev: google.maps.PolyMouseEvent) => this.polyMouseOut.emit(ev) },
      { name: 'mouseover', handler: (ev: google.maps.PolyMouseEvent) => this.polyMouseOver.emit(ev) },
      { name: 'mouseup', handler: (ev: google.maps.PolyMouseEvent) => this.polyMouseUp.emit(ev) },
      { name: 'rightclick', handler: (ev: google.maps.PolyMouseEvent) => this.polyRightClick.emit(ev) },
    ];
    handlers.forEach((obj) => {
      const eventObservable = this.polygonManager.createEventObservable<
        google.maps.PolyMouseEvent | google.maps.MapMouseEvent
      >(obj.name, this);
      if (eventObservable) {
        const os = eventObservable.subscribe(obj.handler as (e: any) => void);
        this.subscriptions.push(os);
      }
    });

    const pathEventObservable = this.polygonManager.createPathEventObservable(this);
    if (pathEventObservable) {
      const os = pathEventObservable.subscribe((pathEvent) => this.polyPathsChange.emit(pathEvent));
      this.subscriptions.push(os);
    }
  }

  private updatePolygonOptions(changes: SimpleChanges): google.maps.PolygonOptions {
    return Object.keys(changes)
      .filter((k) => AgmrPolygon.polygonOptionsAttributes.indexOf(k) !== -1)
      .reduce((obj: any, k: string) => {
        obj[k] = changes[k].currentValue;
        return obj;
      }, {});
  }
}
