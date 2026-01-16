import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract } from '../../model/contract.model';
import { environment } from '../../../../environments/environment';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED',
  DELETED = 'DELETED',
}

export interface CreateContractDto {
  userId: string;
  packageId: string;
  value: number;
  mode: string;
  payday: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  private baseApiUrl = environment.apiBaseUrl;

  private contractsUrl = this.baseApiUrl + '/api/contracts';

  constructor(private http: HttpClient) {}

  createContract(contractData: CreateContractDto): Observable<any> {
    return this.http.post<any>(`${this.contractsUrl}`, contractData);
  }

  getContractsByUser(userId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.contractsUrl}/user/${userId}`);
  }

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

  activateContract(contractId: string): Observable<any> {
    return this.http.patch<any>(`${this.contractsUrl}/${contractId}/status`, { status: 'ACTIVE' });
  }
}
