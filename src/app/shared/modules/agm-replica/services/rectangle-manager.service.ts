import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { GoogleMapsApiService } from './google-maps-api.service';
import { AgmrRectangle } from '../directives/agmr-rectangle.directive';
import { first, shareReplay, switchMap } from 'rxjs/operators';

@Injectable()
export class RectangleManagerService {
  private rectangles: Map<AgmrRectangle, Observable<google.maps.Rectangle>> = new Map<
    AgmrRectangle,
    Observable<google.maps.Rectangle>
  >();

  constructor(private mapWrapper: GoogleMapsApiService, private zone: NgZone) {}

  public addRectangle(rectangle: AgmrRectangle): void {
    const rectangleObservable = this.mapWrapper.getNativeMap().pipe(
      switchMap(() =>
        this.mapWrapper.createRectangle({
          bounds: {
            north: rectangle.north || 0,
            east: rectangle.east || 0,
            south: rectangle.south || 0,
            west: rectangle.west || 0,
          },
          clickable: rectangle.clickable,
          draggable: rectangle.draggable,
          editable: rectangle.editable,
          fillColor: rectangle.fillColor,
          fillOpacity: rectangle.fillOpacity,
          strokeColor: rectangle.strokeColor,
          strokeOpacity: rectangle.strokeOpacity,
          strokePosition: google.maps.StrokePosition[rectangle.strokePosition],
          strokeWeight: rectangle.strokeWeight,
          visible: rectangle.visible,
          zIndex: rectangle.zIndex,
        }),
      ),
      shareReplay(1),
    );
    this.rectangles.set(rectangle, rectangleObservable);
  }

  /**
   * Removes the given rectangle from the map.
   */
  public removeRectangle(rectangle: AgmrRectangle): void {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (rectangleObservable) {
      rectangleObservable.pipe(first()).subscribe((r) => {
        r.setMap(null);
        this.rectangles.delete(rectangle);
      });
    }
  }

  public setOptions(rectangle: AgmrRectangle, options: google.maps.RectangleOptions): void {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (rectangleObservable) {
      rectangleObservable.pipe(first()).subscribe((r) => {
        const actualStrokePosition = (options.strokePosition as any) as keyof typeof google.maps.StrokePosition;
        options.strokePosition = google.maps.StrokePosition[actualStrokePosition];
        r.setOptions(options);
      });
    }
  }

  public getBounds(rectangle: AgmrRectangle): Observable<google.maps.LatLngBounds | undefined> {
    return new Observable((observer: Observer<google.maps.LatLngBounds | undefined>) => {
      const rectangleObservable = this.rectangles.get(rectangle);
      if (rectangleObservable) {
        rectangleObservable.pipe(first()).subscribe((r) => {
          observer.next(r.getBounds());
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public setBounds(rectangle: AgmrRectangle): void {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (rectangleObservable) {
      rectangleObservable.pipe(first()).subscribe((r) => {
        r.setBounds({
          north: rectangle.north || 0,
          east: rectangle.east || 0,
          south: rectangle.south || 0,
          west: rectangle.west || 0,
        });
      });
    }
  }

  public setEditable(rectangle: AgmrRectangle): void {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (rectangleObservable) {
      rectangleObservable.pipe(first()).subscribe((r) => {
        r.setEditable(rectangle.editable);
      });
    }
  }

  public setDraggable(rectangle: AgmrRectangle): void {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (rectangleObservable) {
      rectangleObservable.pipe(first()).subscribe((r) => {
        r.setDraggable(rectangle.draggable);
      });
    }
  }

  public setVisible(rectangle: AgmrRectangle): void {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (rectangleObservable) {
      rectangleObservable.pipe(first()).subscribe((r) => {
        r.setVisible(rectangle.visible);
      });
    }
  }

  public createEventObservable<T>(eventName: string, rectangle: AgmrRectangle): Observable<T> | undefined {
    const rectangleObservable = this.rectangles.get(rectangle);
    if (!rectangleObservable) {
      return undefined;
    }

    let listener: google.maps.MapsEventListener | null = null;
    return new Observable((observer) => {
      rectangleObservable.pipe(first()).subscribe((r) => {
        listener = r.addListener(eventName, (e: T) => this.zone.run(() => observer.next(e)));
      });
      return () => {
        if (listener !== null) {
          listener.remove();
        }
      };
    });
  }
}
