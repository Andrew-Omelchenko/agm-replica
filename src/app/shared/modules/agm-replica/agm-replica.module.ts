import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILoaderApiConfig } from './models/api-config.model';
import { AGMR_API_CONFIG } from './tokens/api-config';
import { GoogleMapsApiLoaderService } from './services/google-maps-api-loader.service';
import { AgmrMapComponent } from './views/agmr-map/agmr-map.component';
import { AgmrFullscreenControl } from './views/agmr-map/directives/agmr-fullscreen-control';
import { AgmrMapTypeControl } from './views/agmr-map/directives/agmr-map-type-control';
import { AgmrPanControl } from './views/agmr-map/directives/agmr-pan-control';
import { AgmrRotateControl } from './views/agmr-map/directives/agmr-rotate-control';
import { AgmrScaleControl } from './views/agmr-map/directives/agmr-scale-control';
import { AgmrStreetViewControl } from './views/agmr-map/directives/agmr-street-view-control';
import { AgmrZoomControl } from './views/agmr-map/directives/agmr-zoom-control';
import { AgmrMarker } from './directives/agmr-marker.directive';
import { AgmrInfoWindowComponent } from './views/agmr-info-window/agmr-info-window.component';
import { AgmrSnazzyInfoWindowComponent } from './views/agmr-snazzy-info-window/agmr-snazzy-info-window.component';
import { AgmrPolyline } from './directives/agmr-polyline.directive';
import { AgmrPolylinePoint } from './directives/agmr-polyline-point.directive';
import { AgmrPolylineIcon } from './directives/agmr-polyline-icon.directive';
import { AgmrCircle } from './directives/agmr-circle.directive';
import { AgmrPolygon } from './directives/agmr-polygon.directive';
import { AgmrRectangle } from './directives/agmr-rectangle.directive';
import { AgmrFitBounds } from './directives/agmr-fit-bounds.directive';

@NgModule({
  declarations: [
    AgmrMapComponent,
    AgmrFullscreenControl,
    AgmrMapTypeControl,
    AgmrPanControl,
    AgmrRotateControl,
    AgmrScaleControl,
    AgmrStreetViewControl,
    AgmrZoomControl,
    AgmrMarker,
    AgmrInfoWindowComponent,
    AgmrSnazzyInfoWindowComponent,
    AgmrPolyline,
    AgmrPolylinePoint,
    AgmrPolylineIcon,
    AgmrCircle,
    AgmrPolygon,
    AgmrRectangle,
    AgmrFitBounds,
  ],
  imports: [CommonModule],
  exports: [
    AgmrMapComponent,
    AgmrMarker,
    AgmrFitBounds,
    AgmrInfoWindowComponent,
    AgmrSnazzyInfoWindowComponent,
    AgmrPolyline,
    AgmrPolylinePoint,
    AgmrPolylineIcon,
    AgmrCircle,
    AgmrPolygon,
    AgmrRectangle,
  ],
})
export class AgmReplicaModule {
  static forRoot(config?: ILoaderApiConfig): ModuleWithProviders<AgmReplicaModule> {
    return {
      ngModule: AgmReplicaModule,
      providers: [GoogleMapsApiLoaderService, { provide: AGMR_API_CONFIG, useValue: config }],
    };
  }
}
