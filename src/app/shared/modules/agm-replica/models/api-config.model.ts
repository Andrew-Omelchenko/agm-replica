export enum GoogleMapsScriptProtocol {
  HTTP = 1,
  HTTPS = 2,
  AUTO = 3,
}

export interface ILoaderApiConfig {
  apiKey?: string;
  clientId?: string;
  channel?: string;
  apiVersion?: string;
  hostAndPath?: string;
  protocol?: GoogleMapsScriptProtocol;
  libraries?: string[];
  region?: string;
  language?: string;
}
