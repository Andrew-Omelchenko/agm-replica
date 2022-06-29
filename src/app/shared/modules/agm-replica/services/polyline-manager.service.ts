import { Injectable, NgZone } from '@angular/core';

import { GoogleMapsApiService } from './google-maps-api.service';
import { AgmrPolyline } from '../directives/agmr-polyline.directive';
import { AgmrPolylinePoint } from '../directives/agmr-polyline-point.directive';
import { Observable, Observer, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { createMVCEventObservable, IMVCEvent } from '../utils/mvc-array.utils';

@Injectable()
export class PolylineManagerService {
  private polylines: Map<AgmrPolyline, Observable<google.maps.Polyline>> = new Map<
    AgmrPolyline,
    Observable<google.maps.Polyline>
  >();

  constructor(private mapsWrapper: GoogleMapsApiService, private zone: NgZone) {}

  private static convertPoints(line: AgmrPolyline): google.maps.LatLngLiteral[] {
    return line.getPoints().map((point: AgmrPolylinePoint) => {
      return { lat: point.latitude, lng: point.longitude } as google.maps.LatLngLiteral;
    });
  }

  private static convertPath(path: keyof typeof google.maps.SymbolPath | string): google.maps.SymbolPath | string {
    const symbolPath = google.maps.SymbolPath[path as keyof typeof google.maps.SymbolPath];
    if (typeof symbolPath === 'number') {
      return symbolPath;
    } else {
      return path;
    }
  }

  private static convertIcons(line: AgmrPolyline): Array<google.maps.IconSequence> {
    const icons = line.getIcons().map(
      (agmrIcon) =>
        ({
          fixedRotation: agmrIcon.fixedRotation,
          offset: agmrIcon.offset,
          repeat: agmrIcon.repeat,
          icon: {
            anchor: new google.maps.Point(agmrIcon.anchorX || 0, agmrIcon.anchorY || 0),
            fillColor: agmrIcon.fillColor,
            fillOpacity: agmrIcon.fillOpacity,
            path: PolylineManagerService.convertPath(agmrIcon.path || ''),
            rotation: agmrIcon.rotation,
            scale: agmrIcon.scale,
            strokeColor: agmrIcon.strokeColor,
            strokeOpacity: agmrIcon.strokeOpacity,
            strokeWeight: agmrIcon.strokeWeight,
          },
        } as google.maps.IconSequence),
    );
    // prune undefined values;
    icons.forEach((icon) => {
      Object.entries(icon).forEach(([key, val]) => {
        if (typeof val === 'undefined') {
          delete (icon as any)[key];
        }
      });
      if (typeof icon?.icon?.anchor?.x === 'undefined' || typeof icon?.icon?.anchor?.y === 'undefined') {
        delete icon?.icon?.anchor;
      }
    });
    return icons;
  }

  public addPolyline(line: AgmrPolyline): void {
    const polylineObservable = this.mapsWrapper.getNativeMap().pipe(
      map(() => [PolylineManagerService.convertPoints(line), PolylineManagerService.convertIcons(line)]),
      switchMap(([path, icons]) =>
        this.mapsWrapper.createPolyline({
          path: path as google.maps.LatLngLiteral[],
          icons: icons as google.maps.IconSequence[],
          clickable: line.clickable,
          draggable: line.draggable,
          editable: line.editable,
          geodesic: line.geodesic,
          strokeColor: line.strokeColor,
          strokeOpacity: line.strokeOpacity,
          strokeWeight: line.strokeWeight,
          visible: line.visible,
          zIndex: line.zIndex,
        }),
      ),
      shareReplay(1),
    );
    this.polylines.set(line, polylineObservable);
  }

  public updatePolylinePoints(line: AgmrPolyline): void {
    const path = PolylineManagerService.convertPoints(line);
    const polylineObservable = this.polylines.get(line);
    if (polylineObservable) {
      polylineObservable.subscribe((l) => this.zone.run(() => l.setPath(path)));
    }
  }

  public updateIconSequences(line: AgmrPolyline): void {
    const icons = PolylineManagerService.convertIcons(line);
    const polylineObservable = this.polylines.get(line);
    if (polylineObservable) {
      polylineObservable.subscribe((l) => this.zone.run(() => l.setOptions({ icons })));
    }
  }

  public setPolylineOptions(line: AgmrPolyline, options: { [propName: string]: any }): void {
    const polylineObservable = this.polylines.get(line);
    if (polylineObservable) {
      polylineObservable.subscribe((l) => this.zone.run(() => l.setOptions(options)));
    }
  }

  public deletePolyline(line: AgmrPolyline): void {
    const polylineObservable = this.polylines.get(line);
    if (polylineObservable) {
      polylineObservable.subscribe((l: google.maps.Polyline) => {
        this.zone.run(() => {
          l.setMap(null);
          this.polylines.delete(line);
        });
      });
    }
  }

  private getMVCPath(line: AgmrPolyline): Observable<google.maps.MVCArray<google.maps.LatLng> | undefined> {
    return new Observable((observer: Observer<google.maps.MVCArray<google.maps.LatLng> | undefined>) => {
      const polylineObservable = this.polylines.get(line);
      if (polylineObservable) {
        polylineObservable.subscribe((l) => {
          observer.next(l.getPath());
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public getPath(line: AgmrPolyline): Observable<google.maps.LatLng[] | undefined> {
    return this.getMVCPath(line).pipe(
      map((path: google.maps.MVCArray<google.maps.LatLng> | undefined) => {
        return path ? path.getArray() : undefined;
      }),
    );
  }

  public createEventObservable<T>(eventName: string, line: AgmrPolyline): Observable<T> | undefined {
    const polylineObservable = this.polylines.get(line);
    if (!polylineObservable) {
      return undefined;
    }

    let listener: google.maps.MapsEventListener | null = null;
    return new Observable((observer: Observer<T>) => {
      polylineObservable.subscribe((l) => {
        listener = l.addListener(eventName, (e: T) => this.zone.run(() => observer.next(e)));
      });
      return () => {
        if (listener !== null) {
          listener.remove();
        }
      };
    });
  }

  public createPathEventObservable(
    line: AgmrPolyline,
  ): Observable<IMVCEvent<google.maps.LatLng> | undefined> | undefined {
    const polylineObservable = this.polylines.get(line);
    if (!polylineObservable) {
      return undefined;
    }
    return this.getMVCPath(line).pipe(
      switchMap((mvcPath) => (mvcPath ? createMVCEventObservable(mvcPath) : of(undefined))),
    );
  }
}
