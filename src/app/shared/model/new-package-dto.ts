export interface RoleConfigurationDTO {
  rolId: string;
  totalAccount: number;
  price: number;
  roleName?: string;
}

export interface NewPackageDTO {
  name: string;
  description?: string;
  configurations: RoleConfigurationDTO[];
  images?: File[];
}
