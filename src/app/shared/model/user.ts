export interface User {
  id: string;
  code?: string;
  strUserName: string;
  strStatus: string;
  dtmLatestUpdateDate: string;
  dtmCreateDate?: string;
  dependentOn?: User;
  dependentCount?: number;
  isDeleted?: boolean;
  deletedAt?: boolean;
  displayName?: string;
  email?: string;
  rol?: {
    strDescription1?: string;
    strName?: string;
  };
  basicData?: {
    id?: string;
    strPersonType: 'N' | 'J';
    strStatus?: string;
    documentTypeId?: string;
    documentNumber?: string;
    documentType?: {
      id: string;
      documentType: string;
    };
    naturalPersonData?: {
      firstName?: string;
      secondName?: string;
      firstSurname?: string;
      secondSurname?: string;
      birthDate?: string;
      sex?: string;
      maritalStatus?: string;
    };
    legalEntityData?: {
      businessName?: string;
      webSite?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
    };
  };
}
