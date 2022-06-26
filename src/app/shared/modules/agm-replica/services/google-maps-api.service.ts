import { Injectable, NgZone } from '@angular/core';
import { Observable, of, ReplaySubject, throwError } from 'rxjs';
import { GoogleMapsApiLoaderService } from './google-maps-api-loader.service';
import { catchError, first, map, shareReplay, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class GoogleMapsApiService {
  private mapSubject$: ReplaySubject<google.maps.Map> = new ReplaySubject<google.maps.Map>(1);

  constructor(private loader: GoogleMapsApiLoaderService, private zone: NgZone) {}

  public createMap(el: HTMLElement, mapOptions: google.maps.MapOptions): Observable<void> {
    return this.zone.runOutsideAngular(() => {
      return this.loader.load().pipe(
        tap(() => {
          this.mapSubject$.next(new google.maps.Map(el, mapOptions));
        }),
        catchError((e) => {
          console.log('Error loading Google Maps API');
          return throwError(e);
        }),
      );
    });
  }

  public setMapOptions(options: google.maps.MapOptions): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((m: google.maps.Map) => m.setOptions(options)),
    );
  }

  /**
   * Creates a Google Map marker with the map context
   */
  public createMarker(
    options: google.maps.MarkerOptions = {},
    addToMap: boolean = true,
  ): Observable<google.maps.Marker> {
    return this.zone.runOutsideAngular(() => {
      return this.mapSubject$.pipe(
        map((m: google.maps.Map) => {
          if (addToMap) {
            options.map = m;
          }
          return new google.maps.Marker(options);
        }),
        shareReplay(1),
      );
    });
  }

  public createInfoWindow(options?: google.maps.InfoWindowOptions): Observable<google.maps.InfoWindow> {
    return this.zone.runOutsideAngular(() => {
      return this.mapSubject$.pipe(
        map(() => new google.maps.InfoWindow(options)),
        shareReplay(1),
      );
    });
  }

  public setCenter(latLng: google.maps.LatLngLiteral): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((m: google.maps.Map) => m.setCenter(latLng)),
    );
  }

  public getCenter(): Observable<google.maps.LatLng> {
    return this.zone.runOutsideAngular(() => {
      return this.mapSubject$.pipe(
        first(),
        map((m: google.maps.Map) => m.getCenter()),
      );
    });
  }

  public setZoom(zoom: number): void {
    this.zone.runOutsideAngular(() => {
      this.mapSubject$.pipe(first()).subscribe((m: google.maps.Map) => m.setZoom(zoom));
    });
  }

  public getZoom(): Observable<number> {
    return this.zone.runOutsideAngular(() => {
      return this.mapSubject$.pipe(map((m: google.maps.Map) => m.getZoom()));
    });
  }

  public getBounds(): Observable<google.maps.LatLngBounds> {
    return this.zone.runOutsideAngular(() => {
      return this.mapSubject$.pipe(map((m: google.maps.Map) => m.getBounds() as google.maps.LatLngBounds));
    });
  }

  public getMapTypeId(): Observable<google.maps.MapTypeId> {
    return this.zone.runOutsideAngular(() => {
      return this.mapSubject$.pipe(map((m: google.maps.Map) => m.getMapTypeId()));
    });
  }

  public panTo(latLng: google.maps.LatLng | google.maps.LatLngLiteral): void {
    this.zone.runOutsideAngular(() => this.mapSubject$.pipe(first()).subscribe((m) => m.panTo(latLng)));
  }

  public panBy(x: number, y: number): void {
    this.zone.runOutsideAngular(() => this.mapSubject$.pipe(first()).subscribe((m) => m.panBy(x, y)));
  }

  public fitBounds(
    latLng: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
    padding?: number | google.maps.Padding,
  ): void {
    this.zone.runOutsideAngular(() => this.mapSubject$.pipe(first()).subscribe((m) => m.fitBounds(latLng, padding)));
  }

  public panToBounds(
    latLng: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
    padding?: number | google.maps.Padding,
  ): void {
    this.zone.runOutsideAngular(() => this.mapSubject$.pipe(first()).subscribe((m) => m.panToBounds(latLng, padding)));
  }

  /**
   * Triggers the given event name on the map instance.
   */
  public triggerMapEvent(eventName: string): Observable<void> {
    return this.mapSubject$.pipe(
      tap((m) => google.maps.event.trigger(m, eventName)),
      switchMap(() => of<void>()),
    );
  }

  public getNativeMap(): Observable<google.maps.Map> {
    return this.mapSubject$.asObservable();
  }

  public subscribeToMapEvent(eventName: string): Observable<any> {
    return new Observable((observer) => {
      this.mapSubject$
        .pipe(first())
        .subscribe((m) => m.addListener(eventName, (...evArgs: any) => this.zone.run(() => observer.next(evArgs))));
    });
  }

  public clearInstanceListeners(): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((m: google.maps.Map) => google.maps.event.clearInstanceListeners(m)),
    );
  }
}
