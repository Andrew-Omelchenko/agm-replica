import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
} from '@angular/core';
import { first } from 'rxjs/operators';
import { IdGenerator } from '../../utils/id-generator';
import { AgmrMarker } from '../../directives/agmr-marker.directive';
import { InfoWindowManagerService } from '../../services/info-window-manager.service';

@Component({
  selector: 'agmr-info-window',
  templateUrl: './agmr-info-window.component.html',
  styleUrls: ['./agmr-info-window.component.scss'],
})
export class AgmrInfoWindowComponent implements OnInit, OnChanges, OnDestroy {
  private static infoWindowOptionsInputs: string[] = ['disableAutoPan', 'maxWidth'];

  /**
   * The latitude position of the info window (only usefull if you use it ouside of a {@link AgmrMarker}).
   */
  @Input() public latitude: number | undefined;

  /**
   * The longitude position of the info window (only usefull if you use it ouside of a {@link AgmrMarker}).
   */
  @Input() public longitude: number | undefined;

  /**
   * Disable auto-pan on open. By default, the info window will pan the map so that it is fully
   * visible when it opens.
   */
  @Input() public disableAutoPan: boolean | undefined;

  /**
   * All InfoWindows are displayed on the map in order of their zIndex, with higher values
   * displaying in front of InfoWindows with lower values. By default, InfoWindows are displayed
   * according to their latitude, with InfoWindows of lower latitudes appearing in front of
   * InfoWindows at higher latitudes. InfoWindows are always displayed in front of markers.
   */
  @Input() public zIndex: number | undefined;

  /**
   * Maximum width of the infowindow, regardless of content's width. This value is only considered
   * if it is set before a call to open. To change the maximum width when changing content, call
   * close, update maxWidth, and then open.
   */
  @Input() public maxWidth: number | undefined;

  /**
   * Holds the marker that is the host of the info window (if available)
   */
  public hostMarker: AgmrMarker | undefined;

  /**
   * Holds the native element that is used for the info window content.
   */
  public content: Node | undefined;

  /**
   * Sets the open state for the InfoWindow. You can also call the open() and close() methods.
   */
  @Input() public isOpen = false;

  /**
   * Emits an event when the info window is closed.
   */
  @Output() public infoWindowClose: EventEmitter<void> = new EventEmitter<void>();

  private readonly _id: string;
  private infoWindowAddedToManager = false;

  constructor(private infoWindowManager: InfoWindowManagerService, private elRef: ElementRef) {
    this._id = IdGenerator()
      .next()
      .value.toString();
  }

  public ngOnInit(): void {
    this.content = this.elRef.nativeElement.querySelector('.agmr-info-window-content');
    this.infoWindowManager.addInfoWindow(this);
    this.infoWindowAddedToManager = true;
    this.updateOpenState();
    this.registerEventListeners();
  }

  /** @internal */
  public ngOnChanges(changes: { [key: string]: SimpleChange }): void {
    if (!this.infoWindowAddedToManager) {
      return;
    }
    if (
      (changes['latitude'] || changes['longitude']) &&
      typeof this.latitude === 'number' &&
      typeof this.longitude === 'number'
    ) {
      this.infoWindowManager.setPosition(this);
    }
    if (changes['zIndex']) {
      this.infoWindowManager.setZIndex(this);
    }
    if (changes['isOpen']) {
      this.updateOpenState();
    }
    this.setInfoWindowOptions(changes);
  }

  /** @internal */
  public ngOnDestroy(): void {
    this.infoWindowManager.deleteInfoWindow(this);
  }

  private registerEventListeners(): void {
    const eventListenerObservable = this.infoWindowManager.createEventObservable('closeclick', this);
    if (eventListenerObservable) {
      eventListenerObservable.subscribe(() => {
        this.isOpen = false;
        this.infoWindowClose.emit();
      });
    }
  }

  private updateOpenState(): void {
    this.isOpen ? this.open() : this.close();
  }

  private setInfoWindowOptions(changes: { [key: string]: SimpleChange }): void {
    const options: { [propName: string]: any } = {};
    const optionKeys = Object.keys(changes).filter(
      (k) => AgmrInfoWindowComponent.infoWindowOptionsInputs.indexOf(k) !== -1,
    );
    optionKeys.forEach((k) => {
      options[k] = changes[k].currentValue;
    });
    this.infoWindowManager.setOptions(this, options);
  }

  /**
   * Opens the info window.
   */
  public open(): void {
    this.infoWindowManager.open(this);
  }

  /**
   * Closes the info window.
   */
  public close(): void {
    this.infoWindowManager
      .close(this)
      .pipe(first())
      .subscribe(() => this.infoWindowClose.emit());
  }

  /** @internal */
  public id(): string {
    return this._id;
  }

  /** @internal */
  public toString(): string {
    return 'AgmrInfoWindow-' + this._id.toString();
  }
}
