export interface RoleConfigurationDTO {
  rolId: string;
  totalAccount: number;
  price: number;
  roleName?: string;
}

export interface UsageLimitVariableDTO {
  variableName: string;
  displayName: string;
  maxValue: number;
  targetApplication: string;
}

export interface NewPackageDTO {
  name: string;
  description?: string;
  price?: number;
  isBillable?: boolean;
  showInLanding?: boolean;
  displayName?: string;
  displayOrder?: number;
  isHighlighted?: boolean;
  ctaLabel?: string;
  ctaType?: string;
  configurations: RoleConfigurationDTO[];
  images?: File[];
  usageLimitVariables?: UsageLimitVariableDTO[];
}
