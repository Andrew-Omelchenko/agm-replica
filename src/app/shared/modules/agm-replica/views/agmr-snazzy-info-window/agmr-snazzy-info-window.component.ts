import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Host,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  SimpleChanges,
  SkipSelf,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { AgmrMarker } from '../../directives/agmr-marker.directive';
import { GoogleMapsApiLoaderService } from '../../services/google-maps-api-loader.service';
import { GoogleMapsApiService } from '../../services/google-maps-api.service';
import { MarkerManagerService } from '../../services/marker-manager.service';
import { SnazzyInfoWindow } from './snazzy-info-window/classes/snazzy-info-window.class';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'agmr-snazzy-info-window',
  templateUrl: './agmr-snazzy-info-window.component.html',
  styleUrls: ['./agmr-snazzy-info-window.component.scss'],
})
export class AgmrSnazzyInfoWindowComponent implements AfterViewInit, OnDestroy, OnChanges {
  /**
   * The latitude and longitude where the info window is anchored.
   * The offset will default to 0px when using this option. Only required/used if you are not using a agm-marker.
   */
  @Input() public latitude: number | undefined;

  /**
   * The longitude where the info window is anchored.
   * The offset will default to 0px when using this option. Only required/used if you are not using a agm-marker.
   */
  @Input() public longitude: number | undefined;

  /**
   * Changes the open status of the snazzy info window.
   */
  @Input() public isOpen = false;

  /**
   * Emits when the open status changes.
   */
  @Output() public isOpenChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Choose where you want the info window to be displayed, relative to the marker.
   */
  @Input() public placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

  /**
   * The max width in pixels of the info window.
   */
  @Input() public maxWidth: number | string = 200;

  /**
   * The max height in pixels of the info window.
   */
  @Input() public maxHeight: number | string = 200;

  /**
   * The color to use for the background of the info window.
   */
  @Input() public backgroundColor: string | undefined;

  /**
   * A custom padding size around the content of the info window.
   */
  @Input() public padding: string | undefined;

  /**
   * A custom border around the info window. Set to false to completely remove the border.
   * The units used for border should be the same as pointer.
   */
  @Input() public border: { width: string; color: string } | boolean | undefined;

  /**
   * A custom CSS border radius property to specify the rounded corners of the info window.
   */
  @Input() public borderRadius: string | undefined;

  /**
   * The font color to use for the content inside the body of the info window.
   */
  @Input() public fontColor: string | undefined;

  /**
   * The font size to use for the content inside the body of the info window.
   */
  @Input() public fontSize: string | undefined;

  /**
   * The height of the pointer from the info window to the marker.
   * Set to false to completely remove the pointer.
   * The units used for pointer should be the same as border.
   */
  @Input() public pointer: string | boolean | undefined;

  /**
   * The CSS properties for the shadow of the info window.
   * Set to false to completely remove the shadow.
   */
  @Input() public shadow:
    | boolean
    | { h?: string; v?: string; blur: string; spread: string; opacity: number; color: string }
    | undefined;

  /**
   * Determines if the info window will open when the marker is clicked.
   * An internal listener is added to the Google Maps click event which calls the open() method.
   */
  @Input() public openOnMarkerClick = true;

  /**
   * Determines if the info window will close when the map is clicked. An internal listener is added to
   * the Google Maps click event which calls the close() method.
   * This will not activate on the Google Maps drag event when the user is panning the map.
   */
  @Input() public closeOnMapClick = true;

  /**
   * An optional CSS class to assign to the wrapper container of the info window.
   * Can be used for applying custom CSS to the info window.
   */
  @Input() public wrapperClass: string | undefined;

  /**
   * Determines if the info window will close when any other Snazzy Info Window is opened.
   */
  @Input() public closeWhenOthersOpen = false;

  /**
   * Determines if the info window will show a close button.
   */
  @Input() public showCloseButton = true;

  /**
   * Determines if the info window will be panned into view when opened.
   */
  @Input() public panOnOpen = true;

  /**
   * Emits before the info window opens.
   */
  @Output() public beforeOpen: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits before the info window closes.
   */
  @Output() public afterClose: EventEmitter<void> = new EventEmitter<void>();

  /**
   * @internal
   */
  @ViewChild('outerWrapper', { read: ElementRef }) public outerWrapper: ElementRef | undefined;

  /**
   * @internal
   */
  @ViewChild('viewContainer', { read: ViewContainerRef }) public viewContainerRef: ViewContainerRef | undefined;

  /**
   * @internal
   */
  @ContentChild(TemplateRef) templateRef: TemplateRef<any> | undefined;

  private nativeSnazzyInfoWindow: any;
  private snazzyInfoWindowInitialized: Observable<any> | null = null;

  constructor(
    @Optional() @Host() @SkipSelf() private marker: AgmrMarker,
    private loader: GoogleMapsApiLoaderService,
    private wrapper: GoogleMapsApiService,
    private manager: MarkerManagerService,
  ) {}

  /**
   * @internal
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if (this.nativeSnazzyInfoWindow == null) {
      return;
    }
    if ('isOpen' in changes && this.isOpen) {
      this.openInfoWindow();
    } else if ('isOpen' in changes && !this.isOpen) {
      this.closeInfoWindow();
    }
    if (('latitude' in changes || 'longitude' in changes) && this.marker == null) {
      this.updatePosition();
    }
  }

  /**
   * @internal
   */
  public ngAfterViewInit(): void {
    const markerObservable = this.manager.getNativeMarker(this.marker);
    this.snazzyInfoWindowInitialized = this.wrapper.getNativeMap().pipe(
      first(),
      switchMap((nativeMap) =>
        markerObservable
          ? markerObservable.pipe(
              first(),
              map((nativeMarker) => ({ nativeMap, nativeMarker })),
            )
          : of({ nativeMap, nativeMarker: null }),
      ),
      map(({ nativeMap, nativeMarker }) => {
        const options: any = {
          map: nativeMap,
          content: '',
          placement: this.placement,
          maxWidth: this.maxWidth,
          maxHeight: this.maxHeight,
          backgroundColor: this.backgroundColor,
          padding: this.padding,
          border: this.border,
          borderRadius: this.borderRadius,
          fontColor: this.fontColor,
          pointer: this.pointer,
          shadow: this.shadow,
          closeOnMapClick: this.closeOnMapClick,
          openOnMarkerClick: this.openOnMarkerClick,
          closeWhenOthersOpen: this.closeWhenOthersOpen,
          showCloseButton: this.showCloseButton,
          panOnOpen: this.panOnOpen,
          wrapperClass: this.wrapperClass,
          callbacks: {
            beforeOpen: () => {
              this.createViewContent();
              this.beforeOpen.emit();
            },
            afterOpen: () => {
              this.isOpenChange.emit(this.openStatus());
            },
            afterClose: () => {
              this.afterClose.emit();
              this.isOpenChange.emit(this.openStatus());
            },
          },
        };
        if (nativeMarker !== null) {
          options.marker = nativeMarker;
        } else {
          options.position = {
            lat: this.latitude,
            lng: this.longitude,
          };
        }
        this.nativeSnazzyInfoWindow = new SnazzyInfoWindow(options);
      }),
      shareReplay(1),
    );
    this.snazzyInfoWindowInitialized.pipe(first()).subscribe(() => {
      if (this.isOpen) {
        this.openInfoWindow();
      }
    });
  }

  /**
   * @internal
   */
  public ngOnDestroy(): void {
    if (this.nativeSnazzyInfoWindow) {
      this.nativeSnazzyInfoWindow.destroy();
    }
  }

  /**
   * Returns true when the Snazzy Info Window is initialized and open.
   */
  public openStatus(): boolean {
    return this.nativeSnazzyInfoWindow && this.nativeSnazzyInfoWindow.isOpen();
  }

  private openInfoWindow(): void {
    this.snazzyInfoWindowInitialized?.pipe(first()).subscribe(() => {
      this.createViewContent();
      this.nativeSnazzyInfoWindow.open();
    });
  }

  private closeInfoWindow(): void {
    this.snazzyInfoWindowInitialized?.pipe(first()).subscribe(() => {
      this.nativeSnazzyInfoWindow.close();
    });
  }

  private createViewContent(): void {
    if (this.viewContainerRef?.length === 1) {
      return;
    }
    if (this.templateRef) {
      const evr = this.viewContainerRef?.createEmbeddedView(this.templateRef);
      this.nativeSnazzyInfoWindow.setContent(this.outerWrapper?.nativeElement);
      // we have to run this in a separate cycle.
      setTimeout(() => {
        evr?.detectChanges();
      });
    }
  }

  private updatePosition(): void {
    this.nativeSnazzyInfoWindow.setPosition({
      lat: this.latitude,
      lng: this.longitude,
    });
  }
}
