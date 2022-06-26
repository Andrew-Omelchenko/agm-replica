import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer, of } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';

import { AgmrMarker } from '../directives/agmr-marker.directive';
import { GoogleMapsApiService } from './google-maps-api.service';

@Injectable()
export class MarkerManagerService {
  private markers: Map<AgmrMarker, Observable<google.maps.Marker>> = new Map<
    AgmrMarker,
    Observable<google.maps.Marker>
  >();

  constructor(protected mapsWrapper: GoogleMapsApiService, protected zone: NgZone) {}

  public convertAnimation(
    uiAnim: keyof typeof google.maps.Animation | undefined,
  ): Observable<google.maps.Animation | undefined> {
    if (!uiAnim) {
      return of(undefined);
    } else {
      return this.mapsWrapper.getNativeMap().pipe(map(() => google.maps.Animation[uiAnim]));
    }
  }

  public addMarker(marker: AgmrMarker): void {
    this.convertAnimation(marker.animation)
      .pipe(
        first(),
        map((animation) => {
          if (marker && typeof marker?.latitude === 'number' && typeof marker?.longitude === 'number') {
            return this.mapsWrapper.createMarker({
              animation,
              position: {
                lat: marker.latitude,
                lng: marker.longitude,
              },
              label: marker.label,
              draggable: marker.draggable,
              icon: marker.iconUrl,
              opacity: marker.opacity,
              visible: marker.visible,
              zIndex: marker.zIndex,
              title: marker.title,
              clickable: marker.clickable,
            });
          }
          return undefined;
        }),
      )
      .subscribe((markerObservable) => {
        if (markerObservable) {
          this.markers.set(marker, markerObservable);
        }
      });
  }

  public deleteMarker(markerDirective: AgmrMarker): void {
    const markerObservable = this.markers.get(markerDirective);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => {
        this.zone.run(() => {
          m.setMap(null);
          this.markers.delete(markerDirective);
        });
      });
    }
  }

  public updateMarkerPosition(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable && typeof marker?.latitude === 'number' && typeof marker?.longitude === 'number') {
      markerObservable.subscribe((m: google.maps.Marker) =>
        m.setPosition({ lat: marker.latitude || 0, lng: marker.longitude || 0 }),
      );
    }
  }

  public updateTitle(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setTitle(marker?.title || null));
    }
  }

  public updateLabel(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setLabel(marker?.label || null));
    }
  }

  public updateDraggable(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setDraggable(marker?.draggable || false));
    }
  }

  public updateIcon(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setIcon(marker?.iconUrl || null));
    }
  }

  public updateOpacity(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setOpacity(marker?.opacity || 1));
    }
  }

  public updateVisible(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setVisible(marker?.visible || true));
    }
  }

  public updateZIndex(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setZIndex(marker?.zIndex || 0));
    }
  }

  public updateClickable(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      markerObservable.subscribe((m: google.maps.Marker) => m.setClickable(marker?.clickable || false));
    }
  }

  public updateAnimation(marker: AgmrMarker): void {
    const markerObservable = this.markers.get(marker);
    if (markerObservable) {
      this.convertAnimation(marker.animation)
        .pipe(
          first(),
          switchMap((animation) =>
            markerObservable.pipe(tap((m: google.maps.Marker) => m.setAnimation(animation || null))),
          ),
        )
        .subscribe();
    }
  }

  public getNativeMarker(marker: AgmrMarker): Observable<google.maps.Marker | undefined> {
    return new Observable((observer: Observer<google.maps.Marker | undefined>) => {
      const markerObservable = this.markers.get(marker);
      if (markerObservable) {
        markerObservable.subscribe((m) => {
          observer.next(m);
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public createEventObservable<T extends google.maps.MapMouseEvent | void>(
    eventName: string,
    marker: AgmrMarker,
  ): Observable<T> {
    return new Observable((observer) => {
      const markerObservable = this.markers.get(marker);
      if (markerObservable) {
        markerObservable.subscribe((m) => {
          m.addListener(eventName, (e: T) => this.zone.run(() => observer.next(e)));
        });
      } else {
        observer.next();
      }
    });
  }
}
