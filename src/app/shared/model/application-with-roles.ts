import { Rol } from "./rol";

export interface ApplicationWithRoles {
  id: string;
  strName: string;
  strRoles: Rol[];
}