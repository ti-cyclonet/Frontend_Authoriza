export interface User {
  id: string;
  strUserName: string;
  strPassword: string;
  strStatus: string;
  dtmLatestUpdateDate?: string;
  ingIdBasicData?: number;
  ingIdDependence?: number;

  rol?: {
    strName: string;
    strDescription1: string;
  };

  basicData?: {
    strPersonType: 'J' | 'N';
  };
}
