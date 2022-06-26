import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { flatMap, map, sample, shareReplay, switchMap } from 'rxjs/operators';

import { GoogleMapsApiLoaderService } from './google-maps-api-loader.service';
import { BoundsMap } from '../types/common.types';

@Injectable()
export class FitBoundsService {
  private readonly bounds$: Observable<google.maps.LatLngBounds>;
  protected readonly boundsChangeSampleTime$ = new BehaviorSubject<number>(200);
  protected readonly includeInBounds$ = new BehaviorSubject<BoundsMap>(
    new Map<string, google.maps.LatLng | google.maps.LatLngLiteral>(),
  );

  constructor(private loader: GoogleMapsApiLoaderService) {
    this.bounds$ = loader.load().pipe(
      flatMap(() => this.includeInBounds$),
      sample(this.boundsChangeSampleTime$.pipe(switchMap((time) => timer(0, time)))),
      map((includeInBounds) => this.generateBounds(includeInBounds)),
      shareReplay(1),
    );
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
}
