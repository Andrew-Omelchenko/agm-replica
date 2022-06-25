import { InjectionToken } from '@angular/core';
import { ILoaderApiConfig } from '../models/api-config.model';

export const AGMR_API_CONFIG = new InjectionToken<ILoaderApiConfig>('angular-google-maps AGMR_API_CONFIG');
