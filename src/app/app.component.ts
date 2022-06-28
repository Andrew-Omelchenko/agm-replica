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
}
