import { bootstrapApplication } from '@angular/platform-browser';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { mergeApplicationConfig } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/shared/interceptors/auth.interceptor';
import { LoadingInterceptor } from './app/shared/interceptors/loading.interceptor';
import { appConfig } from './app/app.config';

const finalConfig = mergeApplicationConfig(appConfig, {
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
});

bootstrapApplication(AppComponent, finalConfig);
