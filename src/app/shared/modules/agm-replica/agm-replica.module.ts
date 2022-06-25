import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILoaderApiConfig } from './models/api-config.model';
import { AGMR_API_CONFIG } from './tokens/api-config';
import { ApiLoaderService } from './services/api-loader.service';
import { GoogleMapsApiService } from './services/google-maps-api.service';
import { AgmrMapComponent } from './views/agmr-map/agmr-map.component';
import { FitBoundsService } from './services/fit-bounds.service';

@NgModule({
  declarations: [AgmrMapComponent],
  imports: [CommonModule],
  exports: [AgmrMapComponent],
})
export class AgmReplicaModule {
  static forRoot(config?: ILoaderApiConfig): ModuleWithProviders<AgmReplicaModule> {
    return {
      ngModule: AgmReplicaModule,
      providers: [
        ApiLoaderService,
        GoogleMapsApiService,
        FitBoundsService,
        { provide: AGMR_API_CONFIG, useValue: config },
      ],
    };
  }
}
