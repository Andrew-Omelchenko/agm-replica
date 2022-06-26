import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILoaderApiConfig } from './models/api-config.model';
import { AGMR_API_CONFIG } from './tokens/api-config';
import { GoogleMapsApiLoaderService } from './services/google-maps-api-loader.service';
import { GoogleMapsApiService } from './services/google-maps-api.service';
import { AgmrMapComponent } from './views/agmr-map/agmr-map.component';
import { FitBoundsService } from './services/fit-bounds.service';
import { AgmrFullscreenControl } from './views/agmr-map/directives/agmr-fullscreen-control';
import { AgmrMapTypeControl } from './views/agmr-map/directives/agmr-map-type-control';
import { AgmrPanControl } from './views/agmr-map/directives/agmr-pan-control';
import { AgmrRotateControl } from './views/agmr-map/directives/agmr-rotate-control';
import { AgmrScaleControl } from './views/agmr-map/directives/agmr-scale-control';
import { AgmrStreetViewControl } from './views/agmr-map/directives/agmr-street-view-control';
import { AgmrZoomControl } from './views/agmr-map/directives/agmr-zoom-control';
import { MarkerManagerService } from './services/marker-manager.service';
import { AgmrMarker } from './directives/agmr-marker.directive';
import { AgmrInfoWindowComponent } from './views/agmr-info-window/agmr-info-window.component';
import { InfoWindowManagerService } from './services/info-window-manager.service';
import { AgmrSnazzyInfoWindowComponent } from './views/agmr-snazzy-info-window/agmr-snazzy-info-window.component';

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
  ],
  imports: [CommonModule],
  exports: [AgmrMapComponent, AgmrMarker, AgmrInfoWindowComponent],
})
export class AgmReplicaModule {
  static forRoot(config?: ILoaderApiConfig): ModuleWithProviders<AgmReplicaModule> {
    return {
      ngModule: AgmReplicaModule,
      providers: [
        { provide: AGMR_API_CONFIG, useValue: config },
        GoogleMapsApiLoaderService,
        GoogleMapsApiService,
        FitBoundsService,
        MarkerManagerService,
        InfoWindowManagerService,
      ],
    };
  }
}
