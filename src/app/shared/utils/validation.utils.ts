import { Application } from '../model/application.model';
import { Rol } from '../model/rol';
import { MenuOption } from '../model/menu_option';

export function isApplicationDTOValid(applicationDTO: Application): boolean {
  if (!applicationDTO) return false;

  // Validar campos principales
  const { strName, strDescription, strUrlImage, strSlug, strTags, strRoles } = applicationDTO;

  if (
    !strName?.trim() ||
    !strDescription?.trim() ||
    !strUrlImage?.trim() ||
    !strSlug?.trim() ||
    !Array.isArray(strTags) || strTags.length === 0 ||
    !Array.isArray(strRoles) || strRoles.length === 0
  ) {
    return false;
  }

  // Validar cada rol
  for (const rol of strRoles) {
    const { strName, strDescription1, strDescription2, menuOptions } = rol as any;

    if (
      !strName?.trim() ||
      !strDescription1?.trim() ||
      !strDescription2?.trim() ||
      !Array.isArray(menuOptions) || menuOptions.length === 0
    ) {
      return false;
    }

    // Validar cada opción de menú
    for (const menu of menuOptions) {
      const {
        strName,
        strDescription,
        strType,
        ingOrder,
        strSubmenus
      } = menu as any;

      if (
        !strName?.trim() ||
        !strDescription?.trim() ||
        !strType?.trim() ||
        typeof ingOrder !== 'number'
      ) {
        return false;
      }

      // Validar submenús si existen
      if (Array.isArray(strSubmenus)) {
        for (const submenu of strSubmenus) {
          const {
            strName,
            strDescription,
            strType,
            ingOrder,
            strUrl
          } = submenu as any;

          if (
            !strName?.trim() ||
            !strDescription?.trim() ||
            !strType?.trim() ||
            typeof ingOrder !== 'number' ||
            !strUrl?.trim()
          ) {
            return false;
          }
        }
      }
    }
  }

  return true;
}
