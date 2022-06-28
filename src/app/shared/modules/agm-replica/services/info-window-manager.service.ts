import { Injectable, NgZone } from '@angular/core';
import { MarkerManagerService } from './marker-manager.service';
import { GoogleMapsApiService } from './google-maps-api.service';
import { AgmrInfoWindowComponent } from '../views/agmr-info-window/agmr-info-window.component';
import { Observable, Observer } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable()
export class InfoWindowManagerService {
  private infoWindows: Map<AgmrInfoWindowComponent, Observable<google.maps.InfoWindow>> = new Map<
    AgmrInfoWindowComponent,
    Observable<google.maps.InfoWindow>
  >();

  constructor(
    private mapsWrapper: GoogleMapsApiService,
    private markerManager: MarkerManagerService,
    private zone: NgZone,
  ) {}

  public deleteInfoWindow(infoWindow: AgmrInfoWindowComponent): void {
    const iWindow = this.infoWindows.get(infoWindow);
    if (iWindow) {
      this.zone.run(() => {
        iWindow.subscribe((i) => {
          i.close();
          this.infoWindows.delete(infoWindow);
        });
      });
    }
  }

  public setPosition(infoWindow: AgmrInfoWindowComponent): void {
    const iWindow = this.infoWindows.get(infoWindow);
    if (iWindow && typeof infoWindow?.latitude === 'number' && typeof infoWindow?.longitude === 'number') {
      iWindow.subscribe((i) => {
        i.setPosition({
          lat: infoWindow.latitude || 0,
          lng: infoWindow.longitude || 0,
        });
      });
    }
  }

  public setZIndex(infoWindow: AgmrInfoWindowComponent): void {
    const iWindow = this.infoWindows.get(infoWindow);
    if (iWindow && typeof infoWindow.zIndex === 'number') {
      iWindow.subscribe((i) => i.setZIndex(infoWindow.zIndex || 0));
    }
  }

  public open(infoWindow: AgmrInfoWindowComponent): void {
    const iWindow = this.infoWindows.get(infoWindow);
    if (iWindow) {
      if (infoWindow.hostMarker) {
        this.markerManager
          .getNativeMarker(infoWindow.hostMarker)
          .pipe(first())
          .subscribe((marker) => {
            if (marker) {
              this.mapsWrapper
                .getNativeMap()
                .pipe(first())
                .subscribe((m) => iWindow.subscribe((i) => i.open(m, marker)));
            }
          });
      }
      this.mapsWrapper.getNativeMap().subscribe((m) => iWindow.subscribe((i) => i.open(m)));
    }
  }

  public close(infoWindow: AgmrInfoWindowComponent): Observable<void> {
    return new Observable((observer: Observer<void>) => {
      const iWindow = this.infoWindows.get(infoWindow);
      if (iWindow) {
        iWindow.subscribe((i) => {
          i.close();
          observer.next();
          observer.complete();
        });
      } else {
        observer.next();
        observer.complete();
      }
    });
  }

  public setOptions(infoWindow: AgmrInfoWindowComponent, options: google.maps.InfoWindowOptions): void {
    const iWindow = this.infoWindows.get(infoWindow);
    if (iWindow) {
      iWindow.subscribe((i) => i.setOptions(options));
    }
  }

  public addInfoWindow(infoWindow: AgmrInfoWindowComponent): void {
    const options: google.maps.InfoWindowOptions = {
      content: infoWindow.content,
      maxWidth: infoWindow.maxWidth,
      zIndex: infoWindow.zIndex,
      disableAutoPan: infoWindow.disableAutoPan,
    };
    if (typeof infoWindow.latitude === 'number' && typeof infoWindow.longitude === 'number') {
      options.position = { lat: infoWindow.latitude, lng: infoWindow.longitude };
    }
    const infoWindowObservable = this.mapsWrapper.createInfoWindow(options);
    this.infoWindows.set(infoWindow, infoWindowObservable);
  }

  /**
   * Creates a Google Maps event listener for the given InfoWindow as an Observable
   */
  public createEventObservable<T>(eventName: string, infoWindow: AgmrInfoWindowComponent): Observable<T> | undefined {
    const iWindow = this.infoWindows.get(infoWindow);
    if (!iWindow) {
      return undefined;
    }
    return new Observable((observer: Observer<T>) => {
      iWindow.subscribe((i) => i.addListener<any>(eventName, (e: T) => this.zone.run(() => observer.next(e))));
    });
  }
}
