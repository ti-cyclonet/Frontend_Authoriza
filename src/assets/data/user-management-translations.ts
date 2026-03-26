export const USER_MANAGEMENT_TRANSLATIONS = {
  es: {
    userManagement: {
      title: 'Gestión Avanzada de Usuarios',
      createUser: 'Crear Usuario',
      searchPlaceholder: 'Buscar usuarios, roles o aplicaciones...',
      usersList: 'Lista de Usuarios',
      filters: {
        all: 'Todos',
        principals: 'Principales',
        dependents: 'Dependientes',
        active: 'Activos',
        inactive: 'Inactivos'
      },
      stats: {
        total: 'Total',
        active: 'Activos',
        principals: 'Principales',
        dependents: 'Dependientes'
      },
      table: {
        name: 'Nombre',
        username: 'Usuario',
        type: 'Tipo',
        roles: 'Roles',
        status: 'Estado',
        lastUpdate: 'Última Actualización',
        actions: 'Acciones'
      },
      types: {
        principal: 'Principal',
        dependent: 'Dependiente'
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        dependencies: 'Dependencias'
      }
    },
    userWizard: {
      title: 'Crear Nuevo Usuario',
      previous: 'Anterior',
      next: 'Siguiente',
      create: 'Crear Usuario',
      creating: 'Creando...',
      of: 'de',
      steps: {
        basicInfo: 'Información Básica',
        accountConfig: 'Configuración',
        roleAssignment: 'Roles',
        confirmation: 'Confirmación'
      },
      step1: {
        title: 'Información Básica',
        description: 'Ingresa los datos básicos del usuario',
        username: 'Nombre de Usuario',
        usernamePlaceholder: 'Ej: juan.perez',
        email: 'Correo Electrónico',
        emailPlaceholder: 'Ej: juan@empresa.com',
        personType: 'Tipo de Persona',
        naturalPerson: 'Persona Natural',
        legalEntity: 'Persona Jurídica',
        documentType: 'Tipo de Documento',
        selectDocumentType: 'Selecciona un tipo de documento',
        documentNumber: 'Número de Documento',
        documentNumberPlaceholder: 'Ingresa el número de documento',
        firstName: 'Primer Nombre',
        secondName: 'Segundo Nombre',
        firstSurname: 'Primer Apellido',
        secondSurname: 'Segundo Apellido',
        birthDate: 'Fecha de Nacimiento',
        sex: 'Sexo',
        selectSex: 'Selecciona el sexo',
        maritalStatus: 'Estado Civil',
        selectMaritalStatus: 'Selecciona el estado civil',
        phone: 'Teléfono',
        phonePlaceholder: 'Ej: +57 300 123 4567',
        businessName: 'Razón Social',
        website: 'Sitio Web',
        websitePlaceholder: 'Ej: https://empresa.com',
        contactName: 'Nombre de Contacto',
        contactPhone: 'Teléfono de Contacto',
        contactEmail: 'Correo de Contacto',
        taxId: 'NIT/RUT',
        legalRepresentative: 'Representante Legal',
        isPrincipal: 'Usuario Principal',
        companyCode: 'Código de Empresa',
        companyCodeRequired: 'El código de empresa es obligatorio para usuarios principales',
        companyCodePreview: 'Código generado'
      },
      step2: {
        title: 'Configuración de Cuenta',
        description: 'Define el tipo de usuario y configuraciones',
        userType: 'Tipo de Usuario',
        principalUser: 'Usuario Principal',
        principalDescription: 'Puede contratar paquetes y gestionar dependientes',
        dependentUser: 'Usuario Dependiente',
        dependentDescription: 'Depende de un usuario principal para acceder a roles',
        selectPrincipal: 'Usuario Principal',
        selectPrincipalPlaceholder: 'Selecciona el usuario principal',
        status: 'Estado Inicial',
        expirationDate: 'Fecha de Expiración'
      },
      step3: {
        title: 'Asignación de Roles',
        description: 'Selecciona los paquetes o roles para el usuario',
        availablePackages: 'Paquetes Disponibles',
        availableRoles: 'Roles Disponibles',
        selectedItems: 'Elementos Seleccionados'
      },
      step4: {
        title: 'Confirmación',
        description: 'Revisa la información antes de crear el usuario',
        basicInfo: 'Información Básica',
        accountConfig: 'Configuración de Cuenta',
        assignedItems: 'Elementos Asignados',
        fullName: 'Nombre Completo'
      }
    },
    dependencyManagement: {
      title: 'Gestión de Dependencias',
      principalUser: 'Usuario Principal',
      tabs: {
        overview: 'Resumen',
        roles: 'Roles',
        packages: 'Paquetes',
        dependents: 'Dependientes'
      },
      stats: {
        assignedRoles: 'Roles Asignados',
        contractedPackages: 'Paquetes Contratados',
        dependentUsers: 'Usuarios Dependientes',
        currentStatus: 'Estado Actual'
      },
      activeRoles: 'Roles Activos',
      assignedRoles: 'Roles Asignados',
      assignRole: 'Asignar Rol',
      assignNewRole: 'Asignar Nuevo Rol',
      assign: 'Asignar',
      noRolesAssigned: 'No hay roles asignados',
      assignedOn: 'Asignado el',
      contractedPackages: 'Paquetes Contratados',
      contractPackage: 'Contratar Paquete',
      noPackagesContracted: 'No hay paquetes contratados',
      includedRoles: 'Roles Incluidos',
      contractedOn: 'Contratado el',
      expiresOn: 'Expira el',
      renew: 'Renovar',
      cancel: 'Cancelar',
      dependentUsers: 'Usuarios Dependientes',
      addDependent: 'Agregar Dependiente',
      noDependentUsers: 'No hay usuarios dependientes',
      manageRoles: 'Gestionar Roles',
      removeDependent: 'Remover Dependiente'
    },
    validation: {
      required: 'Este campo es requerido',
      email: 'Ingresa un correo válido',
      minLength: 'Mínimo 3 caracteres',
      pattern: 'El formato ingresado no es válido'
    },
    common: {
      loading: 'Cargando...',
      saving: 'Guardando...',
      close: 'Cerrar',
      cancel: 'Cancelar',
      save: 'Guardar',
      saveChanges: 'Guardar Cambios',
      active: 'Activo',
      inactive: 'Inactivo'
    },
    packages: {
      title: 'Paquetes',
      description: 'Gestión y configuración de paquetes',
      addNew: 'Agregar Nuevo Paquete',
      listView: 'Vista de Lista',
      cardsView: 'Vista de Tarjetas',
      roles: 'Roles',
      priceTotal: 'Precio Total',
      showing: 'Mostrando',
      of: 'de',
      packages: 'paquetes'
    }
  },
  en: {
    userManagement: {
      title: 'Advanced User Management',
      createUser: 'Create User',
      searchPlaceholder: 'Search users, roles or applications...',
      usersList: 'Users List',
      filters: {
        all: 'All',
        principals: 'Principals',
        dependents: 'Dependents',
        active: 'Active',
        inactive: 'Inactive'
      },
      stats: {
        total: 'Total',
        active: 'Active',
        principals: 'Principals',
        dependents: 'Dependents'
      },
      table: {
        name: 'Name',
        username: 'Username',
        type: 'Type',
        roles: 'Roles',
        status: 'Status',
        lastUpdate: 'Last Update',
        actions: 'Actions'
      },
      types: {
        principal: 'Principal',
        dependent: 'Dependent'
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        dependencies: 'Dependencies'
      }
    },
    userWizard: {
      title: 'Create New User',
      previous: 'Previous',
      next: 'Next',
      create: 'Create User',
      creating: 'Creating...',
      of: 'of',
      steps: {
        basicInfo: 'Basic Information',
        accountConfig: 'Configuration',
        roleAssignment: 'Roles',
        confirmation: 'Confirmation'
      },
      step1: {
        title: 'Basic Information',
        description: 'Enter the user basic data',
        username: 'Username',
        usernamePlaceholder: 'Ex: john.doe',
        email: 'Email',
        emailPlaceholder: 'Ex: john@company.com',
        personType: 'Person Type',
        naturalPerson: 'Natural Person',
        legalEntity: 'Legal Entity',
        documentType: 'Document Type',
        selectDocumentType: 'Select a document type',
        documentNumber: 'Document Number',
        documentNumberPlaceholder: 'Enter document number',
        firstName: 'First Name',
        secondName: 'Second Name',
        firstSurname: 'First Surname',
        secondSurname: 'Second Surname',
        birthDate: 'Birth Date',
        sex: 'Sex',
        selectSex: 'Select sex',
        maritalStatus: 'Marital Status',
        selectMaritalStatus: 'Select marital status',
        phone: 'Phone',
        phonePlaceholder: 'Ex: +1 555 123 4567',
        businessName: 'Business Name',
        website: 'Website',
        websitePlaceholder: 'Ex: https://company.com',
        contactName: 'Contact Name',
        contactPhone: 'Contact Phone',
        contactEmail: 'Contact Email',
        taxId: 'Tax ID',
        legalRepresentative: 'Legal Representative',
        isPrincipal: 'Principal User',
        companyCode: 'Company Code',
        companyCodeRequired: 'Company code is required for principal users',
        companyCodePreview: 'Generated code'
      },
      step2: {
        title: 'Account Configuration',
        description: 'Define user type and configurations',
        userType: 'User Type',
        principalUser: 'Principal User',
        principalDescription: 'Can contract packages and manage dependents',
        dependentUser: 'Dependent User',
        dependentDescription: 'Depends on a principal user to access roles',
        selectPrincipal: 'Principal User',
        selectPrincipalPlaceholder: 'Select the principal user',
        status: 'Initial Status',
        expirationDate: 'Expiration Date'
      },
      step3: {
        title: 'Role Assignment',
        description: 'Select packages or roles for the user',
        availablePackages: 'Available Packages',
        availableRoles: 'Available Roles',
        selectedItems: 'Selected Items'
      },
      step4: {
        title: 'Confirmation',
        description: 'Review information before creating the user',
        basicInfo: 'Basic Information',
        accountConfig: 'Account Configuration',
        assignedItems: 'Assigned Items',
        fullName: 'Full Name'
      }
    },
    dependencyManagement: {
      title: 'Dependency Management',
      principalUser: 'Principal User',
      tabs: {
        overview: 'Overview',
        roles: 'Roles',
        packages: 'Packages',
        dependents: 'Dependents'
      },
      stats: {
        assignedRoles: 'Assigned Roles',
        contractedPackages: 'Contracted Packages',
        dependentUsers: 'Dependent Users',
        currentStatus: 'Current Status'
      },
      activeRoles: 'Active Roles',
      assignedRoles: 'Assigned Roles',
      assignRole: 'Assign Role',
      assignNewRole: 'Assign New Role',
      assign: 'Assign',
      noRolesAssigned: 'No roles assigned',
      assignedOn: 'Assigned on',
      contractedPackages: 'Contracted Packages',
      contractPackage: 'Contract Package',
      noPackagesContracted: 'No packages contracted',
      includedRoles: 'Included Roles',
      contractedOn: 'Contracted on',
      expiresOn: 'Expires on',
      renew: 'Renew',
      cancel: 'Cancel',
      dependentUsers: 'Dependent Users',
      addDependent: 'Add Dependent',
      noDependentUsers: 'No dependent users',
      manageRoles: 'Manage Roles',
      removeDependent: 'Remove Dependent'
    },
    validation: {
      required: 'This field is required',
      email: 'Enter a valid email',
      minLength: 'Minimum 3 characters',
      pattern: 'The entered format is not valid'
    },
    common: {
      loading: 'Loading...',
      saving: 'Saving...',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      saveChanges: 'Save Changes',
      active: 'Active',
      inactive: 'Inactive'
    },
    packages: {
      title: 'Packages',
      description: 'Package management and configuration',
      addNew: 'Add New Package',
      listView: 'List View',
      cardsView: 'Cards View',
      roles: 'Roles',
      priceTotal: 'Total Price',
      showing: 'Showing',
      of: 'of',
      packages: 'packages'
    }
  }
};