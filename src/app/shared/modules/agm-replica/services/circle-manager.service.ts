import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { first } from 'rxjs/operators';

import { GoogleMapsApiService } from './google-maps-api.service';
import { AgmrCircle } from '../directives/agmr-circle.directive';

@Injectable()
export class CircleManagerService {
  private circles: Map<AgmrCircle, Observable<google.maps.Circle>> = new Map<
    AgmrCircle,
    Observable<google.maps.Circle>
  >();

  constructor(private mapWrapper: GoogleMapsApiService, private zone: NgZone) {}

  public addCircle(circle: AgmrCircle): void {
    const circleObservable = this.mapWrapper.createCircle({
      center: { lat: circle.latitude || 0, lng: circle.longitude || 0 },
      clickable: circle.clickable,
      draggable: circle.draggable,
      editable: circle.editable,
      fillColor: circle.fillColor,
      fillOpacity: circle.fillOpacity,
      radius: circle.radius,
      strokeColor: circle.strokeColor,
      strokeOpacity: circle.strokeOpacity,
      strokePosition: google.maps.StrokePosition[circle.strokePosition],
      strokeWeight: circle.strokeWeight,
      visible: circle.visible,
      zIndex: circle.zIndex,
    });
    this.circles.set(circle, circleObservable);
  }

  /**
   * Removes the given circle from the map.
   */
  public removeCircle(circle: AgmrCircle): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable.pipe(first()).subscribe((c) => {
        c.setMap(null);
        this.circles.delete(circle);
      });
    }
  }

  public setOptions(circle: AgmrCircle, options: google.maps.CircleOptions): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable.pipe(first()).subscribe((c) => {
        const actualParam = (options.strokePosition as any) as keyof typeof google.maps.StrokePosition;
        options.strokePosition = google.maps.StrokePosition[actualParam];
        c.setOptions(options);
      });
    }
  }

  public getBounds(circle: AgmrCircle): Observable<google.maps.LatLngBounds | undefined> {
    return new Observable((observer: Observer<google.maps.LatLngBounds | undefined>) => {
      const circleObservable = this.circles.get(circle);
      if (circleObservable) {
        circleObservable.pipe(first()).subscribe((c) => {
          observer.next(c.getBounds());
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public getCenter(circle: AgmrCircle): Observable<google.maps.LatLng | undefined> {
    return new Observable((observer: Observer<google.maps.LatLng | undefined>) => {
      const circleObservable = this.circles.get(circle);
      if (circleObservable) {
        circleObservable.pipe(first()).subscribe((c) => {
          observer.next(c.getCenter());
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public getRadius(circle: AgmrCircle): Observable<number | undefined> {
    return new Observable((observer: Observer<number | undefined>) => {
      const circleObservable = this.circles.get(circle);
      if (circleObservable) {
        circleObservable.pipe(first()).subscribe((c) => {
          observer.next(c.getRadius());
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public setCenter(circle: AgmrCircle): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable
        .pipe(first())
        .subscribe((c) => c.setCenter({ lat: circle.latitude || 0, lng: circle.longitude || 0 }));
    }
  }

  public setEditable(circle: AgmrCircle): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable.pipe(first()).subscribe((c) => c.setEditable(circle.editable));
    }
  }

  public setDraggable(circle: AgmrCircle): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable.pipe(first()).subscribe((c) => c.setDraggable(circle.draggable));
    }
  }

  public setVisible(circle: AgmrCircle): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable.pipe(first()).subscribe((c) => c.setVisible(circle.visible));
    }
  }

  public setRadius(circle: AgmrCircle): void {
    const circleObservable = this.circles.get(circle);
    if (circleObservable) {
      circleObservable.pipe(first()).subscribe((c) => c.setRadius(circle.radius));
    }
  }

  public getNativeCircle(circle: AgmrCircle): Observable<google.maps.Circle | undefined> {
    return new Observable((observer: Observer<google.maps.Circle | undefined>) => {
      const circleObservable = this.circles.get(circle);
      if (circleObservable) {
        circleObservable.pipe(first()).subscribe((c) => {
          observer.next(c);
          observer.complete();
        });
      } else {
        observer.next(undefined);
        observer.complete();
      }
    });
  }

  public createEventObservable<T>(eventName: string, circle: AgmrCircle): Observable<T> | undefined {
    const circleObservable = this.circles.get(circle);
    if (!circleObservable) {
      return undefined;
    }
    return new Observable((observer) => {
      circleObservable.pipe(first()).subscribe((c) => {
        c.addListener(eventName, (e: T) => this.zone.run(() => observer.next(e)));
      });
    });
  }
}
