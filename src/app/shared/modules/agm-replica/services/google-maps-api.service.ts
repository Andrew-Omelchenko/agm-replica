import { Injectable, NgZone } from '@angular/core';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { ApiLoaderService } from './api-loader.service';
import { catchError, tap } from 'rxjs/operators';

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

  public getNativeMap(): Observable<google.maps.Map> {
    return this.mapSubject$.asObservable();
  }
}
