import { Inject, Injectable, LOCALE_ID, Optional } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { WINDOW } from '../tokens/window';
import { GoogleMapsScriptProtocol, ILoaderApiConfig } from '../models/api-config.model';
import { AGMR_API_CONFIG } from '../tokens/api-config';

@Injectable()
export class ApiLoaderService {
  private config: ILoaderApiConfig;
  protected readonly SCRIPT_ID: string = 'agmrGoogleMapsApiScript';
  protected readonly callbackName: string = 'agmrAPILoader';

  constructor(
    @Optional() @Inject(AGMR_API_CONFIG) config: any = null,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
    @Inject(LOCALE_ID) private localeId: string,
  ) {
    this.config = config || {};
  }

  public load(): Observable<void> {
    // Google Maps have been already loaded
    if (window?.google?.maps) {
      return of();
    }
    // otherwise...
    const loaded$: Subject<void> = new Subject<void>();

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.id = this.SCRIPT_ID;
    script.src = this.getScriptSource(this.callbackName);
    // @ts-ignore
    window[this.callbackName] = () => loaded$.next();
    script.onerror = (error: Event | string) => loaded$.error(error);
    document.body.appendChild(script);

    return loaded$.asObservable();
  }

  private getScriptSource(callbackName: string): string {
    const protocolType: GoogleMapsScriptProtocol = this.config?.protocol || GoogleMapsScriptProtocol.HTTPS;
    let protocol: string;

    switch (protocolType) {
      case GoogleMapsScriptProtocol.AUTO:
        protocol = '';
        break;
      case GoogleMapsScriptProtocol.HTTP:
        protocol = 'http:';
        break;
      case GoogleMapsScriptProtocol.HTTPS:
        protocol = 'https:';
        break;
    }

    const hostAndPath: string = this.config.hostAndPath || 'maps.googleapis.com/maps/api/js';
    const queryParams: { [key: string]: string | string[] | null } = {
      v: this.config.apiVersion || 'quarterly',
      callback: callbackName || this.callbackName,
      key: this.config.apiKey || null,
      client: this.config.clientId || null,
      channel: this.config.channel || null,
      libraries: this.config.libraries || null,
      region: this.config.region || null,
      language: this.config.language || (this.localeId !== 'en-US' ? this.localeId : null),
    };
    const params: string = Object.keys(queryParams)
      .filter((k: string) => queryParams[k] !== null)
      .filter((k: string) => {
        // remove empty arrays
        return !Array.isArray(queryParams[k]) || (Array.isArray(queryParams[k]) && queryParams[k]?.length === 0);
      })
      .map((k: string) => {
        // join arrays as comma separated strings
        const i = queryParams[k];
        if (Array.isArray(i)) {
          return { key: k, value: i.join(',') };
        }
        return { key: k, value: queryParams[k] };
      })
      .map(({ key, value }) => {
        return `${key}=${value}`;
      })
      .join('&');
    return `${protocol}//${hostAndPath}?${params}`;
  }
}
