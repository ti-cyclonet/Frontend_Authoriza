import { Rol } from "./rol";

export interface Image {
  id: string;
  fileName: string;
  url: string;
}

export interface Configuration {
  id: string;
  price: string;
  totalAccount: number;
  rol: Rol;
  package: {
    id: string;
    name: string;
    description: string;
  };
}

export interface Package {
  id: string;
  name: string;
  description: string;
  configurations: Configuration[];
  images: Image[]; 
}
