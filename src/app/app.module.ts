import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AgmReplicaModule } from './shared/modules/agm-replica/agm-replica.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AgmReplicaModule.forRoot({
      apiKey: '',
      apiVersion: '3.49',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
