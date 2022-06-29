import { Injectable, NgZone } from '@angular/core';
import { merge, Observable, Observer } from 'rxjs';
import { first, map, shareReplay, skip, startWith, switchMap } from 'rxjs/operators';

import { AgmrPolygon } from '../directives/agmr-polygon.directive';
import { GoogleMapsApiService } from './google-maps-api.service';
import { createMVCEventObservable, IMVCEvent } from '../utils/mvc-array.utils';

@Injectable()
export class PolygonManagerService {
  private polygons: Map<AgmrPolygon, Observable<google.maps.Polygon>> = new Map<
    AgmrPolygon,
    Observable<google.maps.Polygon>
  >();

  constructor(private mapWrapper: GoogleMapsApiService, private zone: NgZone) {}

  public addPolygon(polygon: AgmrPolygon): void {
    const polygonObservable = this.mapWrapper.getNativeMap().pipe(
      switchMap(() =>
        this.mapWrapper.createPolygon({
          clickable: polygon.clickable,
          draggable: polygon.draggable,
          editable: polygon.editable,
          fillColor: polygon.fillColor,
          fillOpacity: polygon.fillOpacity,
          geodesic: polygon.geodesic,
          paths: polygon.paths,
          strokeColor: polygon.strokeColor,
          strokeOpacity: polygon.strokeOpacity,
          strokeWeight: polygon.strokeWeight,
          visible: polygon.visible,
          zIndex: polygon.zIndex,
        }),
      ),
      shareReplay(1),
    );
    this.polygons.set(polygon, polygonObservable);
  }

  public updatePolygon(polygon: AgmrPolygon): void {
    const polygonObservable = this.polygons.get(polygon);
    if (polygonObservable) {
      polygonObservable.pipe(first()).subscribe((p) => {
        this.zone.run(() => p.setPaths(polygon.paths));
      });
    }
  }

  public setPolygonOptions(polygon: AgmrPolygon, options: { [propName: string]: any }): void {
    const polygonObservable = this.polygons.get(polygon);
    if (polygonObservable) {
      polygonObservable.pipe(first()).subscribe((p) => p.setOptions(options));
    }
  }

  /**
   * Removes the given polygon from the map.
   */
  public deletePolygon(polygon: AgmrPolygon): void {
    const polygonObservable = this.polygons.get(polygon);
    if (polygonObservable) {
      polygonObservable.pipe(first()).subscribe((p) => {
        p.setMap(null);
        this.polygons.delete(polygon);
      });
    }
  }

  public getPath(polygon: AgmrPolygon): Observable<google.maps.LatLng[] | undefined> {
    return new Observable((observer: Observer<google.maps.LatLng[] | undefined>) => {
      const polygonObservable = this.polygons.get(polygon);
      if (polygonObservable) {
        polygonObservable.pipe(first()).subscribe((p) => {
          observer.next(p.getPath().getArray());
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public getPaths(polygon: AgmrPolygon): Observable<google.maps.LatLng[][] | undefined> {
    return new Observable((observer: Observer<google.maps.LatLng[][] | undefined>) => {
      const polygonObservable = this.polygons.get(polygon);
      if (polygonObservable) {
        polygonObservable.pipe(first()).subscribe((p) => {
          observer.next(
            p
              .getPaths()
              .getArray()
              .map((poly) => poly.getArray()),
          );
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public createEventObservable<T>(eventName: string, polygon: AgmrPolygon): Observable<T> | undefined {
    const polygonObservable = this.polygons.get(polygon);
    if (!polygonObservable) {
      return undefined;
    }

    let listener: google.maps.MapsEventListener | null = null;
    return new Observable((observer) => {
      polygonObservable.pipe(first()).subscribe((p) => {
        listener = p.addListener(eventName, (e: T) => this.zone.run(() => observer.next(e)));
      });
      return () => {
        if (listener !== null) {
          listener.remove();
        }
      };
    });
  }

  public createPathEventObservable(
    polygon: AgmrPolygon,
  ): Observable<IMVCEvent<google.maps.LatLng[] | google.maps.LatLngLiteral[]>> | undefined {
    const polygonObservable = this.polygons.get(polygon);
    if (!polygonObservable) {
      return undefined;
    }
    return polygonObservable.pipe(
      switchMap((p) => {
        const paths = p.getPaths();
        return createMVCEventObservable(paths).pipe(
          // in order to subscribe to them all
          startWith({ newArr: paths.getArray() } as IMVCEvent<google.maps.MVCArray<google.maps.LatLng>>),
          switchMap((parentMVEvent) =>
            // rest parameter
            merge(
              ...parentMVEvent.newArr.map((chMVC, index) =>
                createMVCEventObservable(chMVC).pipe(
                  map((chMVCEvent) => ({ parentMVEvent, chMVCEvent, pathIndex: index })),
                ),
              ),
              // start the merged ob with an event signifying change to parent
            ).pipe(startWith({ parentMVEvent, chMVCEvent: null, pathIndex: null })),
          ),
          // skip the manually added event
          skip(1),
          map(({ parentMVEvent, chMVCEvent, pathIndex }) => {
            let retVal;
            if (!chMVCEvent) {
              retVal = {
                newArr: parentMVEvent.newArr.map((subArr) => subArr.getArray().map((latLng) => latLng.toJSON())),
                eventName: parentMVEvent.eventName,
                index: parentMVEvent.index,
              } as IMVCEvent<google.maps.LatLng[] | google.maps.LatLngLiteral[]>;
              if (parentMVEvent.previous) {
                retVal.previous = parentMVEvent.previous.getArray();
              }
            } else {
              retVal = ({
                newArr: parentMVEvent.newArr.map((subArr) => subArr.getArray().map((latLng) => latLng.toJSON())),
                pathIndex,
                eventName: chMVCEvent.eventName,
                index: chMVCEvent.index,
              } as unknown) as IMVCEvent<google.maps.LatLng[] | google.maps.LatLngLiteral[]>;
              if (chMVCEvent.previous) {
                retVal.previous = [chMVCEvent.previous];
              }
            }
            return retVal;
          }),
        );
      }),
    );
  }
}
