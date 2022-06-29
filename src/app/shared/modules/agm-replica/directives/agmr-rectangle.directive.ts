import { Directive, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { RectangleManagerService } from '../services/rectangle-manager.service';

@Directive({
  selector: 'agmr-rectangle',
})
// tslint:disable:directive-class-suffix
export class AgmrRectangle implements OnInit, OnChanges, OnDestroy {
  private static mapOptions: string[] = [
    'fillColor',
    'fillOpacity',
    'strokeColor',
    'strokeOpacity',
    'strokePosition',
    'strokeWeight',
    'visible',
    'zIndex',
    'clickable',
  ];

  /**
   * The north position of the rectangle (required).
   */
  @Input() public north: number | undefined;

  /**
   * The east position of the rectangle (required).
   */
  @Input() public east: number | undefined;

  /**
   * The south position of the rectangle (required).
   */
  @Input() public south: number | undefined;

  /**
   * The west position of the rectangle (required).
   */
  @Input() public west: number | undefined;

  /**
   * Indicates whether this Rectangle handles mouse events. Defaults to true.
   */
  @Input() public clickable = true;

  /**
   * If set to true, the user can drag this rectangle over the map. Defaults to false.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('rectangleDraggable') public draggable = false;

  /**
   * If set to true, the user can edit this rectangle by dragging the control points shown at
   * the center and around the circumference of the rectangle. Defaults to false.
   */
  @Input() public editable = false;

  /**
   * The fill color. All CSS3 colors are supported except for extended named colors.
   */
  @Input() public fillColor: string | undefined;

  /**
   * The fill opacity between 0.0 and 1.0.
   */
  @Input() public fillOpacity: number | undefined;

  /**
   * The stroke color. All CSS3 colors are supported except for extended named colors.
   */
  @Input() public strokeColor: string | undefined;

  /**
   * The stroke opacity between 0.0 and 1.0
   */
  @Input() public strokeOpacity: number | undefined;

  /**
   * The stroke position. Defaults to CENTER.
   * This property is not supported on Internet Explorer 8 and earlier.
   */
  @Input() public strokePosition: keyof typeof google.maps.StrokePosition = 'CENTER';

  /**
   * The stroke width in pixels.
   */
  @Input() public strokeWeight = 0;

  /**
   * Whether this rectangle is visible on the map. Defaults to true.
   */
  @Input() public visible = true;

  /**
   * The zIndex compared to other polys.
   */
  @Input() public zIndex: number | undefined;

  /**
   * This event is fired when the rectangle's is changed.
   */
  @Output()
  public boundsChange: EventEmitter<google.maps.LatLngBoundsLiteral> = new EventEmitter<
    google.maps.LatLngBoundsLiteral
  >();

  /**
   * This event emitter gets emitted when the user clicks on the rectangle.
   */
  @Output()
  public rectangleClick: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event emitter gets emitted when the user clicks on the rectangle.
   */
  @Output()
  public rectangleDblClick: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is repeatedly fired while the user drags the rectangle.
   */
  // tslint:disable-next-line: no-output-native
  @Output() public drag: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user stops dragging the rectangle.
   */
  @Output() public dragEnd: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the user starts dragging the rectangle.
   */
  @Output()
  public dragStart: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the DOM mousedown event is fired on the rectangle.
   */
  @Output()
  public mouseDown: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the DOM mousemove event is fired on the rectangle.
   */
  @Output()
  public mouseMove: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired on rectangle mouseout.
   */
  @Output() public mouseOut: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired on rectangle mouseover.
   */
  @Output()
  public mouseOver: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the DOM mouseup event is fired on the rectangle.
   */
  @Output() public mouseUp: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  /**
   * This event is fired when the rectangle is right-clicked on.
   */
  @Output()
  public rightClick: EventEmitter<google.maps.MapMouseEvent> = new EventEmitter<google.maps.MapMouseEvent>();

  private rectangleAddedToManager = false;
  private eventSubscriptions: Subscription[] = [];

  constructor(private manager: RectangleManagerService) {}

  /** @internal */
  public ngOnInit(): void {
    this.manager.addRectangle(this);
    this.rectangleAddedToManager = true;
    this.registerEventListeners();
  }

  /** @internal */
  public ngOnChanges(changes: { [key: string]: SimpleChange }): void {
    if (!this.rectangleAddedToManager) {
      return;
    }
    if (changes.north || changes.east || changes.south || changes.west) {
      this.manager.setBounds(this);
    }
    if (changes.editable) {
      this.manager.setEditable(this);
    }
    if (changes.draggable) {
      this.manager.setDraggable(this);
    }
    if (changes.visible) {
      this.manager.setVisible(this);
    }
    this.updateRectangleOptionsChanges(changes);
  }

  /** @internal */
  public ngOnDestroy(): void {
    this.eventSubscriptions.forEach((s) => s.unsubscribe());
    this.eventSubscriptions = [];
    this.manager.removeRectangle(this);
  }

  /**
   * Gets the LatLngBounds of this Rectangle.
   */
  public getBounds(): Observable<google.maps.LatLngBounds | undefined> {
    return this.manager.getBounds(this);
  }

  private updateRectangleOptionsChanges(changes: { [propName: string]: SimpleChange }): void {
    const options: google.maps.RectangleOptions = {};
    const optionKeys = Object.keys(changes).filter((k) => AgmrRectangle.mapOptions.indexOf(k) !== -1);
    optionKeys.forEach((k) => {
      options[(k as unknown) as keyof google.maps.RectangleOptions] = changes[k].currentValue;
    });

    if (optionKeys.length > 0) {
      this.manager.setOptions(this, options);
    }
  }

  private registerEventListeners(): void {
    const events: Map<string, EventEmitter<any>> = new Map<string, EventEmitter<any>>();
    events.set('bounds_changed', this.boundsChange);
    events.set('click', this.rectangleClick);
    events.set('dblclick', this.rectangleDblClick);
    events.set('drag', this.drag);
    events.set('dragend', this.dragEnd);
    events.set('dragStart', this.dragStart);
    events.set('mousedown', this.mouseDown);
    events.set('mousemove', this.mouseMove);
    events.set('mouseout', this.mouseOut);
    events.set('mouseover', this.mouseOver);
    events.set('mouseup', this.mouseUp);
    events.set('rightclick', this.rightClick);

    events.forEach((eventEmitter, eventName) => {
      const eventObservable = this.manager.createEventObservable<google.maps.MapMouseEvent>(eventName, this);
      if (eventObservable) {
        this.eventSubscriptions.push(
          eventObservable.subscribe((value) => {
            switch (eventName) {
              case 'bounds_changed':
                this.manager.getBounds(this).subscribe((bounds) =>
                  eventEmitter.emit({
                    north: bounds?.getNorthEast().lat() || 0,
                    east: bounds?.getNorthEast().lng() || 0,
                    south: bounds?.getSouthWest().lat() || 0,
                    west: bounds?.getSouthWest().lng() || 0,
                  } as google.maps.LatLngBoundsLiteral),
                );
                break;
              default:
                eventEmitter.emit(value);
            }
          }),
        );
      }
    });
  }
}
