import { Rol } from "./rol";

export interface Application {
  id: string;
  code?: string;
  strName: string;
  strDescription: string;
  strUrlImage: string;
  strSlug: string;
  strTags: string[];
  strState: string;
  strRoles: Rol[];
  imageFile?: File;
}