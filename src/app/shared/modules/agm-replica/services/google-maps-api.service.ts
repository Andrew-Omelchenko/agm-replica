import { Injectable, NgZone } from '@angular/core';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { ApiLoaderService } from './api-loader.service';
import { catchError, first, tap } from 'rxjs/operators';

@Injectable()
export class GoogleMapsApiService {
  private mapSubject$: ReplaySubject<google.maps.Map> = new ReplaySubject<google.maps.Map>(1);

  constructor(private loader: ApiLoaderService, private zone: NgZone) {}

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

  public setCenter(latLng: google.maps.LatLngLiteral): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((map: google.maps.Map) => map.setCenter(latLng)),
    );
  }

  public panTo(latLng: google.maps.LatLng | google.maps.LatLngLiteral): void {
    this.zone.runOutsideAngular(() => this.mapSubject$.pipe(first()).subscribe((map) => map.panTo(latLng)));
  }

  public panBy(x: number, y: number): void {
    this.zone.runOutsideAngular(() => this.mapSubject$.pipe(first()).subscribe((map) => map.panBy(x, y)));
  }

  public fitBounds(
    latLng: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
    padding?: number | google.maps.Padding,
  ): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((map) => map.fitBounds(latLng, padding)),
    );
  }

  public panToBounds(
    latLng: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
    padding?: number | google.maps.Padding,
  ): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((map) => map.panToBounds(latLng, padding)),
    );
  }

  public getNativeMap(): Observable<google.maps.Map> {
    return this.mapSubject$.asObservable();
  }

  public clearInstanceListeners(): void {
    this.zone.runOutsideAngular(() =>
      this.mapSubject$.pipe(first()).subscribe((map: google.maps.Map) => google.maps.event.clearInstanceListeners(map)),
    );
  }
}
