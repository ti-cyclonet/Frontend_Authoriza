export interface MenuOption{
    id: string;
    strName: string;
    strDescription: string;
    strUrl: string | null;
    strIcon: string | null;
    strType: string;
    ingOrder: string;
    strState: string;
    strSubmenus: MenuOption[];
    hasSubmenu?: boolean;
  }