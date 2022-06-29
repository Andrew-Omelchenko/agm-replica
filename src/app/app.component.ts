import { Component } from '@angular/core';
import { TSnazzyInfoWindowPlacement } from './shared/modules/agm-replica/types/common.types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public points: {
    lat: number;
    lng: number;
    placement: TSnazzyInfoWindowPlacement;
  }[] = [
    { lat: 49.43099, lng: -123.17769, placement: 'left' },
    { lat: 49.24021, lng: -123.21799, placement: 'right' },
    { lat: 49.23099, lng: -123.17769, placement: 'top' },
    { lat: 49.21002, lng: -123.16021, placement: 'bottom' },
  ];

  public polygonPath = [
    { lat: 49.43099, lng: -123.17769 },
    { lat: 49.37099, lng: -123.22799 },
    { lat: 49.24021, lng: -123.22799 },
    { lat: 49.23099, lng: -123.20769 },
    { lat: 49.21002, lng: -123.16021 },
    { lat: 49.24021, lng: -123.11219 },
    { lat: 49.37099, lng: -123.11219 },
    { lat: 49.43099, lng: -123.17769 },
  ];

  public log(message: string, event: any): void {
    console.log(message, event);
  }
}
