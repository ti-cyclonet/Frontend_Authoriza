import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract } from '../../model/contract.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private baseApiUrl = environment.apiBaseUrl;

  private contractsUrl = this.baseApiUrl + '/api/contracts';

  constructor(private http: HttpClient) {}

  findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return this.http.get<{
      data: Contract[];
      total: number;
      limit: number;
      offset: number;
      totalPages: number;
    }>(`${this.contractsUrl}?limit=${limit}&offset=${offset}`);
  }
}
