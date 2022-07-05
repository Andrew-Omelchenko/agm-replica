export interface IDOMListenerRecord {
  type: string;
  listener: google.maps.MapsEventListener | null;
  persistent: boolean;
  domElement: HTMLElement;
}
