import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { AgmrMarker } from '../directives/agmr-marker.directive';
import { GoogleMapsApiService } from './google-maps-api.service';

@Injectable()
export class MarkerManagerService {
  private markers: Map<AgmrMarker, Observable<google.maps.Marker>> = new Map<
    AgmrMarker,
    Observable<google.maps.Marker>
  >();

  constructor(protected mapsWrapper: GoogleMapsApiService, protected zone: NgZone) {}

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
}
