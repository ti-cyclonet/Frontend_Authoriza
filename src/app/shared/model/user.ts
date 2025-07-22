export interface User {
  id: string;
  strUserName: string;
  strStatus: string;
  dtmLatestUpdateDate: string;
  dependentOn?: User;
  dependentCount?: number;
  rol?: {
    strDescription1?: string;
    strName?: string;
  };
  basicData?: {
    strPersonType: 'N' | 'J';
    naturalPersonData?: {
      firstName?: string;
      secondName?: string;
      firstSurname?: string;
    };
    legalEntityData?: {
      businessName?: string;
    };
  };
}
