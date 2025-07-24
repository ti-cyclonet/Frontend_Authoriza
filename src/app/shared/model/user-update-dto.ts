interface UserUpdateDto {
  id: string;
  strUserName: string;
  strStatus: string;
  dtmLatestUpdateDate: string;
  rolId: string;
  basicData: {
    id: string;
    strPersonType: string;
    strStatus: string;
    naturalPersonData?: {
      id: string;
      firstName: string;
      secondName: string;
      firstSurname: string;
      secondSurname: string;
      birthDate: string;
      maritalStatus: string;
      sex: string;
    };
    legalEntityData?: {
      id: string;
      businessName: string;
      webSite: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    };
  };
}
