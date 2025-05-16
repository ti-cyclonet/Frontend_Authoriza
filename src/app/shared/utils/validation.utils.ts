import { Application } from '../model/application.model';
import { ApplicationDTO } from '../services/applications/applications.service';
import { Rol } from '../model/rol';
import { MenuOption } from '../model/menu_option';

export function validateApplicationDTO(
  app: Application | ApplicationDTO
): string[] {
  const errors: string[] = [];

  if (!app) {
    errors.push('Application object is null or undefined.');
    return errors;
  }

  const {
    strName,
    strDescription,
    strUrlImage,
    strSlug,
    strTags,
    strRoles,
    strState,
    imageFile,
  } = app;

  if (!strName?.trim()) errors.push('Application name is required.');
  if (!strDescription?.trim())
    errors.push('Application description is required.');
  if (!strUrlImage?.trim()) {
    errors.push('Application image URL is required.');
  }
  // Validar archivo de imagen si el estado es TEMPORARY
  if (strState === 'TEMPORARY' && !imageFile) {
    errors.push('Application must have a valid image file.');
  }
  if (!strSlug?.trim()) errors.push('Application slug is required.');
  if (!Array.isArray(strTags) || strTags.length === 0)
    errors.push('Application must have at least one tag.');
  if (!Array.isArray(strRoles) || strRoles.length === 0)
    errors.push('Application must have at least one role.');
  // console.log('strRoles: ', strRoles);

  if (Array.isArray(strRoles)) {
    strRoles.forEach((rol, rolIndex) => {
      const {
        strName: rolName,
        strDescription1,
        strDescription2,
        menuOptions,
      } = rol as any;

      if (!rolName?.trim())
        errors.push(`Role at position ${rolIndex + 1} is missing a name.`);
      if (!strDescription1?.trim())
        errors.push(`Role "${rolName}" is missing description1.`);
      if (!strDescription2?.trim())
        errors.push(`Role "${rolName}" is missing description2.`);
      if (!Array.isArray(menuOptions) || menuOptions.length === 0)
        errors.push(`Role "${rolName}" must have at least one menu option.`);

      if (Array.isArray(menuOptions)) {
        menuOptions.forEach((menu: any, menuIndex: number) => {
          const {
            strName: menuName,
            strDescription: menuDesc,
            strType,
            ingOrder,
            strSubmenus,
          } = menu;

          if (!menuName?.trim())
            errors.push(
              `Menu option at role "${rolName}", position ${
                menuIndex + 1
              } is missing a name.`
            );
          if (!menuDesc?.trim())
            errors.push(`Menu option "${menuName}" is missing description.`);
          if (!strType?.trim())
            errors.push(`Menu option "${menuName}" is missing type.`);
          if (isNaN(Number(ingOrder)))
            errors.push(`Menu option "${menuName}" has invalid order.`);

          if (Array.isArray(strSubmenus)) {
            strSubmenus.forEach((submenu: any, subIndex: number) => {
              const {
                strName: subName,
                strDescription: subDesc,
                strType: subType,
                ingOrder: subOrder,
                strUrl,
              } = submenu;

              if (!subName?.trim())
                errors.push(
                  `Submenu at menu "${menuName}", position ${
                    subIndex + 1
                  } is missing a name.`
                );
              if (!subDesc?.trim())
                errors.push(`Submenu "${subName}" is missing description.`);
              if (!subType?.trim())
                errors.push(`Submenu "${subName}" is missing type.`);
              if (isNaN(Number(subOrder)))
                errors.push(`Submenu "${subName}" has invalid order.`);
              if (!strUrl?.trim())
                errors.push(`Submenu "${subName}" is missing URL.`);
            });
          }
        });
      }
    });
  }

  return errors;
}
