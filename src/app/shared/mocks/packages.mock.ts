// mock-packages.ts

export interface ConfigurationPackage {
  id: number;
  name: string;
  price: number;
}

export interface MockPackage {
  id: number;
  name: string;
  description: string;
  numberOfRoles: number;
  price: number;
  configurationPackages?: ConfigurationPackage[];
}

export const mockPackages: MockPackage[] = [
  {
    id: 1,
    name: 'Paquete Básico',
    description: 'Incluye funcionalidades mínimas.',
    numberOfRoles: 2,
    price: 49.99,
    configurationPackages: [
      { id: 1, name: 'Gestor', price: 25.00 },
      { id: 2, name: 'Asistente', price: 24.99 }
    ]
  },
  {
    id: 2,
    name: 'Paquete Estándar',
    description: 'Funcionalidades adicionales para equipos medianos.',
    numberOfRoles: 5,
    price: 149.99,
    configurationPackages: [
      { id: 3, name: 'Administrador', price: 50.00 },
      { id: 4, name: 'Editor', price: 49.99 },
      { id: 5, name: 'Lector', price: 49.99 }
    ]
  },
  {
    id: 3,
    name: 'Paquete Avanzado',
    description: 'Todo lo necesario para empresas grandes.',
    numberOfRoles: 10,
    price: 299.99,
    configurationPackages: [
      { id: 6, name: 'Superusuario', price: 99.99 }
    ]
  }
];
