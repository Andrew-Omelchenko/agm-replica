import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILoaderApiConfig } from './models/api-config.model';
import { AGMR_API_CONFIG } from './tokens/api-config';
import { ApiLoaderService } from './services/api-loader.service';
import { GoogleMapsApiService } from './services/google-maps-api.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class AgmReplicaModule {
  static forRoot(config?: ILoaderApiConfig): ModuleWithProviders<AgmReplicaModule> {
    return {
      ngModule: AgmReplicaModule,
      providers: [ApiLoaderService, GoogleMapsApiService, { provide: AGMR_API_CONFIG, useValue: config }],
    };
  }
}
