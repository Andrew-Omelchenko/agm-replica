import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, mergeMap, sample, shareReplay, switchMap } from 'rxjs/operators';

import { BoundsMap } from '../types/common.types';
import { GoogleMapsApiService } from './google-maps-api.service';

@Injectable()
export class FitBoundsService {
  private readonly bounds$: Observable<google.maps.LatLngBounds>;
  private readonly boundsChangeSampleTime$ = new BehaviorSubject<number>(200);
  private readonly includeInBounds$ = new BehaviorSubject<BoundsMap>(
    new Map<string, google.maps.LatLng | google.maps.LatLngLiteral>(),
  );

  constructor(private readonly mapsWrapper: GoogleMapsApiService) {
    this.bounds$ = this.mapsWrapper.getNativeMap().pipe(
      mergeMap(() => this.includeInBounds$),
      sample(this.boundsChangeSampleTime$.pipe(switchMap((time) => timer(0, time)))),
      map((includeInBounds) => this.generateBounds(includeInBounds)),
      shareReplay(1),
    );
  }

  public addToBounds(latLng: google.maps.LatLng | google.maps.LatLngLiteral): void {
    const id = this.createIdentifier(latLng);
    if (this.includeInBounds$.value.has(id)) {
      return;
    }
    const boundsMap = this.includeInBounds$.value;
    boundsMap.set(id, latLng);
    this.includeInBounds$.next(boundsMap);
  }

  public removeFromBounds(latLng: google.maps.LatLng | google.maps.LatLngLiteral): void {
    const boundsMap = this.includeInBounds$.value;
    boundsMap.delete(this.createIdentifier(latLng));
    this.includeInBounds$.next(boundsMap);
  }

  public changeFitBoundsChangeSampleTime(timeMs: number): void {
    this.boundsChangeSampleTime$.next(timeMs);
  }

  public getBounds$(): Observable<google.maps.LatLngBounds> {
    return this.bounds$;
  }

  private generateBounds(
    includeInBounds: Map<string, google.maps.LatLng | google.maps.LatLngLiteral>,
  ): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    includeInBounds.forEach((b) => bounds.extend(b));
    return bounds;
  }

  private createIdentifier(latLng: google.maps.LatLng | google.maps.LatLngLiteral): string {
    return `${latLng.lat}+${latLng.lng}`;
  }
}
