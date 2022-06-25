import { AfterContentInit, Component, ElementRef } from '@angular/core';
import { GoogleMapsApiService } from './shared/modules/agm-replica/services/google-maps-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterContentInit {
  constructor(private elemRef: ElementRef, private mapsApiWrapper: GoogleMapsApiService) {}

  public ngAfterContentInit(): void {
    const container = this.elemRef.nativeElement.querySelector('.agm-map-container-inner');
    this.initMapInstance(container);
  }

  private initMapInstance(el: HTMLElement) {
    this.mapsApiWrapper
      .createMap(el, {
        center: { lat: 49.23099, lng: -123.17769 },
        zoom: 14,
        minZoom: 4,
        maxZoom: 14,
      })
      .subscribe(() => console.log('Map is ready'));
  }
}
