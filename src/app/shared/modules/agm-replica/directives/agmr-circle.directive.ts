import { Directive, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CircleManagerService } from '../services/circle-manager.service';
import { first } from 'rxjs/operators';

@Directive({
  selector: 'agmr-circle',
})
// tslint:disable:directive-class-suffix
export class AgmrCircle implements OnInit, OnChanges, OnDestroy {
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
   * The latitude position of the circle (required).
   */
  @Input() public latitude: number | undefined;

  /**
   * The clickable position of the circle (required).
   */
  @Input() public longitude: number | undefined;

  /**
   * Indicates whether this Circle handles mouse events. Defaults to true.
   */
  @Input() public clickable = true;

  /**
   * If set to true, the user can drag this circle over the map. Defaults to false.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('circleDraggable') public draggable = false;

  /**
   * If set to true, the user can edit this circle by dragging the control points shown at
   * the center and around the circumference of the circle. Defaults to false.
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
   * The radius in meters on the Earth's surface.
   */
  @Input() public radius = 0;

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
   * Whether this circle is visible on the map. Defaults to true.
   */
  @Input() public visible = true;

  /**
   * The zIndex compared to other polys.
   */
  @Input() public zIndex: number | undefined;

  /**
   * This event is fired when the circle's center is changed.
   */
  @Output() public centerChange: EventEmitter<google.maps.LatLngLiteral> = new EventEmitter<
    google.maps.LatLngLiteral
  >();

  /**
   * This event emitter gets emitted when the user clicks on the circle.
   */
  @Output() public circleClick: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event emitter gets emitted when the user clicks on the circle.
   */
  @Output() public circleDblClick: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is repeatedly fired while the user drags the circle.
   */
  // tslint:disable-next-line: no-output-native
  @Output() public drag: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the user stops dragging the circle.
   */
  @Output() public dragEnd: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the user starts dragging the circle.
   */
  @Output() public dragStart: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the DOM mousedown event is fired on the circle.
   */
  @Output() public mouseDown: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the DOM mousemove event is fired on the circle.
   */
  @Output() public mouseMove: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired on circle mouseout.
   */
  @Output() public mouseOut: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired on circle mouseover.
   */
  @Output() public mouseOver: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the DOM mouseup event is fired on the circle.
   */
  @Output() public mouseUp: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the circle's radius is changed.
   */
  @Output() public radiusChange: EventEmitter<number> = new EventEmitter<number>();

  /**
   * This event is fired when the circle is right-clicked on.
   */
  @Output() public rightClick: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  private circleAddedToManager = false;
  private eventSubscriptions: Subscription[] = [];

  constructor(private manager: CircleManagerService) {}

  /** @internal */
  public ngOnInit(): void {
    this.manager.addCircle(this);
    this.circleAddedToManager = true;
    this.registerEventListeners();
  }

  /** @internal */
  public ngOnChanges(changes: { [key: string]: SimpleChange }): void {
    if (!this.circleAddedToManager) {
      return;
    }
    if (changes.latitude || changes.longitude) {
      this.manager.setCenter(this);
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
    if (changes.radius) {
      this.manager.setRadius(this);
    }
    this.updateCircleOptionsChanges(changes);
  }

  /** @internal */
  public ngOnDestroy(): void {
    this.eventSubscriptions.forEach((s) => s.unsubscribe());
    this.eventSubscriptions = [];
    this.manager.removeCircle(this);
  }

  private updateCircleOptionsChanges(changes: { [propName: string]: SimpleChange }): void {
    const options: { [propName: string]: any } = {};
    const optionKeys = Object.keys(changes).filter((k) => AgmrCircle.mapOptions.indexOf(k) !== -1);
    optionKeys.forEach((k) => {
      options[k] = changes[k].currentValue;
    });

    if (optionKeys.length > 0) {
      this.manager.setOptions(this, options);
    }
  }

  private registerEventListeners(): void {
    const events: Map<string, EventEmitter<any>> = new Map<string, EventEmitter<any>>();
    events.set('center_changed', this.centerChange);
    events.set('click', this.circleClick);
    events.set('dblclick', this.circleDblClick);
    events.set('drag', this.drag);
    events.set('dragend', this.dragEnd);
    events.set('dragstart', this.dragStart);
    events.set('mousedown', this.mouseDown);
    events.set('mousemove', this.mouseMove);
    events.set('mouseout', this.mouseOut);
    events.set('mouseover', this.mouseOver);
    events.set('mouseup', this.mouseUp);
    events.set('radius_changed', this.radiusChange);
    events.set('rightclick', this.rightClick);

    events.forEach((eventEmitter, eventName) => {
      const observable = this.manager.createEventObservable<google.maps.MapMouseEvent>(eventName, this);
      if (observable) {
        this.eventSubscriptions.push(
          observable.subscribe((value) => {
            switch (eventName) {
              case 'radius_changed':
                this.manager
                  .getRadius(this)
                  .pipe(first())
                  .subscribe((radius) => eventEmitter.emit(radius));
                break;
              case 'center_changed':
                this.manager
                  .getCenter(this)
                  .pipe(first())
                  .subscribe((center) =>
                    eventEmitter.emit({
                      lat: center?.lat() || 0,
                      lng: center?.lng() || 0,
                    } as google.maps.LatLngLiteral),
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

  /**
   * Gets the LatLngBounds of this Circle.
   */
  public getBounds(): Observable<google.maps.LatLngBounds | undefined> {
    return this.manager.getBounds(this);
  }

  public getCenter(): Observable<google.maps.LatLng | undefined> {
    return this.manager.getCenter(this);
  }
}
