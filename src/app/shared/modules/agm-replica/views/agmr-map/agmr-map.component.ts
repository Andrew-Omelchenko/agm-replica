import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { GoogleMapsApiService } from '../../services/google-maps-api.service';
import { FitBoundsService } from '../../services/fit-bounds.service';

@Component({
  selector: 'app-agmr-map',
  templateUrl: './agmr-map.component.html',
  styleUrls: ['./agmr-map.component.scss'],
})
export class AgmrMapComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * Map option attributes that can change over time
   */
  private static mapOptionsAttributes: string[] = [
    'disableDoubleClickZoom',
    'scrollwheel',
    'draggable',
    'draggableCursor',
    'draggingCursor',
    'keyboardShortcuts',
    'styles',
    'zoom',
    'minZoom',
    'maxZoom',
    'mapTypeId',
    'clickableIcons',
    'gestureHandling',
    'tilt',
    'restriction',
  ];

  private observableSubscriptions: Subscription[] = [];
  private fitBoundsSubscription: Subscription | undefined;

  /**
   * The longitude that defines the center of the map.
   */
  @Input() public longitude = 0;

  /**
   * The latitude that defines the center of the map.
   */
  @Input() public latitude = 0;

  /**
   * The zoom level of the map. The default zoom level is 8.
   */
  @Input() public zoom = 8;

  /**
   * The minimal zoom level of the map allowed. When not provided, no restrictions to the zoom level
   * are enforced.
   */
  @Input() public minZoom: number | undefined;

  /**
   * The maximal zoom level of the map allowed. When not provided, no restrictions to the zoom level
   * are enforced.
   */
  @Input() public maxZoom: number | undefined;

  /**
   * The control size for the default map controls. Only governs the controls made by the Maps API itself
   */
  @Input() public controlSize: number | undefined;

  /**
   * Enables/disables if map is draggable.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('mapDraggable') public draggable = true;

  /**
   * Enables/disables zoom and center on double click. Enabled by default.
   */
  @Input() public disableDoubleClickZoom = false;

  /**
   * Enables/disables all default UI of the Google map. Please note: When the map is created, this
   * value cannot get updated.
   */
  @Input() public disableDefaultUI = false;

  /**
   * If false, disables scrollwheel zooming on the map. The scrollwheel is enabled by default.
   */
  @Input() public scrollwheel = true;

  /**
   * Color used for the background of the Map div. This color will be visible when tiles have not
   * yet loaded as the user pans. This option can only be set when the map is initialized.
   */
  @Input() public backgroundColor: string | undefined;

  /**
   * The name or url of the cursor to display when mousing over a draggable map. This property uses
   * the css  * cursor attribute to change the icon. As with the css property, you must specify at
   * least one fallback cursor that is not a URL. For example:
   * [draggableCursor]="'url(http://www.example.com/icon.png), auto;'"
   */
  @Input() public draggableCursor: string | undefined;

  /**
   * The name or url of the cursor to display when the map is being dragged. This property uses the
   * css cursor attribute to change the icon. As with the css property, you must specify at least
   * one fallback cursor that is not a URL. For example:
   * [draggingCursor]="'url(http://www.example.com/icon.png), auto;'"
   */
  @Input() public draggingCursor: string | undefined;

  /**
   * If false, prevents the map from being controlled by the keyboard. Keyboard shortcuts are
   * enabled by default.
   */
  @Input() public keyboardShortcuts = true;

  /**
   * Styles to apply to each of the default map types. Note that for Satellite/Hybrid and Terrain
   * modes, these styles will only apply to labels and geometry.
   */
  @Input() public styles: google.maps.MapTypeStyle[] = [];

  /**
   * When true and the latitude and/or longitude values changes, the Google Maps panTo method is
   * used to
   * center the map. See: https://developers.google.com/maps/documentation/javascript/reference#Map
   */
  @Input() public usePanning = false;

  /**
   * Sets the viewport to contain the given bounds.
   * If this option to `true`, the bounds get automatically computed from all elements that use the {@link AgmrFitBounds} directive.
   */
  @Input() public fitBounds: google.maps.LatLngBoundsLiteral | google.maps.LatLngBounds | boolean = false;

  /**
   * Padding amount for the bounds.
   */
  @Input() public fitBoundsPadding: number | google.maps.Padding | undefined;

  /**
   * The map mapTypeId. Defaults to 'roadmap'.
   */
  @Input() public mapTypeId: keyof typeof google.maps.MapTypeId = 'ROADMAP';

  /**
   * When false, map icons are not clickable. A map icon represents a point of interest,
   * also known as a POI. By default map icons are clickable.
   */
  @Input() public clickableIcons = true;

  /**
   * A map icon represents a point of interest, also known as a POI.
   * When map icons are clickable by default, an info window is displayed.
   * When this property is set to false, the info window will not be shown but the click event
   * will still fire
   */
  @Input() public showDefaultInfoWindow = true;

  /**
   * This setting controls how gestures on the map are handled.
   * Allowed values:
   * - 'cooperative' (Two-finger touch gestures pan and zoom the map. One-finger touch gestures are not handled by the map.)
   * - 'greedy'      (All touch gestures pan or zoom the map.)
   * - 'none'        (The map cannot be panned or zoomed by user gestures.)
   * - 'auto'        [default] (Gesture handling is either cooperative or greedy, depending on whether the page is scrollable or not.
   */
  @Input() public gestureHandling: google.maps.GestureHandlingOptions = 'auto';

  /**
   * Controls the automatic switching behavior for the angle of incidence of
   * the map. The only allowed values are 0 and 45. The value 0 causes the map
   * to always use a 0° overhead view regardless of the zoom level and
   * viewport. The value 45 causes the tilt angle to automatically switch to
   * 45 whenever 45° imagery is available for the current zoom level and
   * viewport, and switch back to 0 whenever 45° imagery is not available
   * (this is the default behavior). 45° imagery is only available for
   * satellite and hybrid map types, within some locations, and at some zoom
   * levels. Note: getTilt returns the current tilt angle, not the value
   * specified by this option. Because getTilt and this option refer to
   * different things, do not bind() the tilt property; doing so may yield
   * unpredictable effects. (Default of AGM is 0 (disabled). Enable it with value 45.)
   */
  @Input() public tilt = 0;

  /**
   * Options for restricting the bounds of the map.
   * User cannot pan or zoom away from restricted area.
   */
  @Input() public restriction: google.maps.MapRestriction | undefined;

  /**
   * This event emitter gets emitted when the user clicks on the map (but not when they click on a
   * marker or infoWindow).
   */
  // tslint:disable-next-line: max-line-length
  @Output() public mapClick: EventEmitter<google.maps.MouseEvent | google.maps.IconMouseEvent> = new EventEmitter<
    google.maps.MouseEvent | google.maps.IconMouseEvent
  >();

  /**
   * This event emitter gets emitted when the user right-clicks on the map (but not when they click
   * on a marker or infoWindow).
   */
  @Output() public mapRightClick: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event emitter gets emitted when the user double-clicks on the map (but not when they click
   * on a marker or infoWindow).
   */
  @Output() public mapDblClick: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event emitter is fired when the map center changes.
   */
  @Output() public centerChange: EventEmitter<google.maps.LatLngLiteral> = new EventEmitter<
    google.maps.LatLngLiteral
  >();

  /**
   * This event is fired when the viewport bounds have changed.
   */
  @Output() public boundsChange: EventEmitter<google.maps.LatLngBounds> = new EventEmitter<google.maps.LatLngBounds>();

  /**
   * This event is fired when the mapTypeId property changes.
   */
  @Output() public mapTypeIdChange: EventEmitter<google.maps.MapTypeId> = new EventEmitter<google.maps.MapTypeId>();

  /**
   * This event is fired when the map becomes idle after panning or zooming.
   */
  @Output() public idle: EventEmitter<void> = new EventEmitter<void>();

  /**
   * This event is fired when the zoom level has changed.
   */
  @Output() public zoomChange: EventEmitter<number> = new EventEmitter<number>();

  /**
   * This event is fired when the google map is fully initialized.
   * You get the google.maps.Map instance as a result of this EventEmitter.
   */
  @Output() public mapReady: EventEmitter<any> = new EventEmitter<any>();

  /**
   * This event is fired when the visible tiles have finished loading.
   */
  @Output() public tilesLoaded: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('mapContainer', { static: true })
  private mapContainerRef: ElementRef<HTMLElement> | undefined;

  // @ContentChildren(AgmrMapControl) mapControls: QueryList<AgmrMapControl>;

  constructor(
    private elem: ElementRef,
    private apiWrapper: GoogleMapsApiService,
    protected fitBoundsService: FitBoundsService,
    private zone: NgZone,
  ) {}

  public ngOnInit(): void {
    if (this.mapContainerRef?.nativeElement) {
      this.initMapInstance(this.mapContainerRef.nativeElement);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.updateMapOptionsChanges(changes);
    this.updatePosition(changes);
  }

  public ngOnDestroy(): void {
    // unsubscribe all registered observable subscriptions
    this.observableSubscriptions.forEach((s) => s.unsubscribe());

    // remove all listeners from the map instance
    this.apiWrapper.clearInstanceListeners();
    if (this.fitBoundsSubscription) {
      this.fitBoundsSubscription.unsubscribe();
    }
  }

  private initMapInstance(el: HTMLElement) {
    this.apiWrapper
      .createMap(el, {
        center: { lat: this.latitude || 0, lng: this.longitude || 0 },
        zoom: this.zoom,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        controlSize: this.controlSize,
        disableDefaultUI: this.disableDefaultUI,
        disableDoubleClickZoom: this.disableDoubleClickZoom,
        scrollwheel: this.scrollwheel,
        backgroundColor: this.backgroundColor,
        draggable: this.draggable,
        draggableCursor: this.draggableCursor,
        draggingCursor: this.draggingCursor,
        keyboardShortcuts: this.keyboardShortcuts,
        styles: this.styles,
        mapTypeId: this.mapTypeId.toLocaleLowerCase(),
        clickableIcons: this.clickableIcons,
        gestureHandling: this.gestureHandling,
        tilt: this.tilt,
        restriction: this.restriction,
      })
      .pipe(
        first(),
        map(() => this.apiWrapper.getNativeMap()),
      )
      .subscribe((mapInstance) => this.mapReady.emit(mapInstance));
  }

  private updateMapOptionsChanges(changes: SimpleChanges) {
    const options: { [propName: string]: any } = {};
    const optionKeys = Object.keys(changes).filter((k) => AgmrMapComponent.mapOptionsAttributes.indexOf(k) !== -1);
    optionKeys.forEach((k) => {
      options[k] = changes[k].currentValue;
    });
    this.apiWrapper.setMapOptions(options);
  }

  private updatePosition(changes: SimpleChanges) {
    if (changes['latitude'] == null && changes['longitude'] == null && !changes['fitBounds']) {
      // no position update needed
      return;
    }

    // we prefer fitBounds in changes
    if ('fitBounds' in changes) {
      this.fitContentBounds();
      return;
    }

    if (typeof this.latitude !== 'number' || typeof this.longitude !== 'number') {
      return;
    }
    this.setCenter();
  }

  private fitContentBounds() {
    switch (this.fitBounds) {
      case true:
        this.subscribeToFitBoundsUpdates();
        break;
      case false:
        if (this.fitBoundsSubscription) {
          this.fitBoundsSubscription.unsubscribe();
        }
        break;
      default:
        if (this.fitBoundsSubscription) {
          this.fitBoundsSubscription.unsubscribe();
        }
        this.updateBounds(this.fitBounds, this.fitBoundsPadding);
    }
  }

  private subscribeToFitBoundsUpdates() {
    this.zone.runOutsideAngular(() => {
      this.fitBoundsSubscription = this.fitBoundsService.getBounds$().subscribe((b) => {
        this.zone.run(() => this.updateBounds(b, this.fitBoundsPadding));
      });
    });
  }

  private updateBounds(
    bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
    padding?: number | google.maps.Padding,
  ): void {
    if (!bounds) {
      return;
    }
    if (
      isLatLngBoundsLiteral(bounds) &&
      typeof google !== 'undefined' &&
      google &&
      google.maps &&
      google.maps.LatLngBounds
    ) {
      const newBounds = new google.maps.LatLngBounds();
      newBounds.union(bounds);
      bounds = newBounds;
    }
    if (this.usePanning) {
      this.apiWrapper.panToBounds(bounds, padding);
      return;
    }
    this.apiWrapper.fitBounds(bounds, padding);
  }

  private setCenter() {
    const newCenter = {
      lat: this.latitude,
      lng: this.longitude,
    };
    if (this.usePanning) {
      this.apiWrapper.panTo(newCenter);
    } else {
      this.apiWrapper.setCenter(newCenter);
    }
  }
}

function isLatLngBoundsLiteral(bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral): boolean {
  return bounds != null && (bounds as any).extend === undefined;
}
