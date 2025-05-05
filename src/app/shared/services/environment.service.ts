import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  readonly apiBaseUrl: string = environment.apiBaseUrl;
}
