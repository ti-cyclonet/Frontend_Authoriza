import { TranslationService } from '../services/translation.service';

/** Descripción de la opción de menú (en inglés, como viene de Authoriza) → clave de traducción. */
const MENU_LABEL_KEYS: { [description: string]: string } = {
  Home: 'menu.home',
  Users: 'menu.users',
  Dependencies: 'menu.dependencies',
  Applications: 'menu.applications',
  Packages: 'menu.packages',
  Contracts: 'menu.contracts',
  Settings: 'menu.settings',
  Dashboard: 'menu.dashboard',
  Materials: 'menu.materials',
  Kardex: 'menu.kardex',
  Invoices: 'menu.invoices',
  Parameters: 'menu.parameters',
};

/**
 * Texto visible de una opción de menú: su descripción traducida (strName es
 * un identificador interno como "homeAuthoriza"). Lo usan el menú lateral y
 * el inferior.
 */
export function menuLabel(description: string | null | undefined, translations: TranslationService, name?: string | null): string {
  const text = String(description || '').trim();
  const key = MENU_LABEL_KEYS[text];
  if (key) return translations.translate(key);
  if (text) return text;
  // Sin descripción: el id interno ("homeAuthoriza", "usersInout") → "menu.home", "menu.users"
  const prefix = /^([a-z]+)/.exec(String(name || ''))?.[1];
  const fromName = prefix ? `menu.${prefix}` : '';
  const translated = fromName ? translations.translate(fromName) : '';
  return translated && translated !== fromName ? translated : String(name || '');
}
