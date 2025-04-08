import { Rol } from "./rol";

export interface Application {
  id: string;
  strName: string;
  strDescription: string;
  strUrlImage: string;
  strSlug: string;
  strTags: string[];
  strState: string;
  strRoles: Rol[];
}