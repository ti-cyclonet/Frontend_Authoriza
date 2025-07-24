export interface CreateFullUser {
  user: {
    strUserName: string;
    strPassword: string;
    strStatus: string;
  };
  basicData: {
    strPersonType: 'N' | 'J';
    strStatus: string;
  };
  naturalPersonData?: {
    firstName: string;
    secondName?: string;
    firstSurname: string;
    secondSurname?: string;
    birthDate: string;
    maritalStatus: string;
    sex: string;
  };
  legalEntityData?: {
    businessName: string;
    webSite?: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
}
