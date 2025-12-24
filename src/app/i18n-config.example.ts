// Ejemplo de integración en app.module.ts de Authoriza
import { CycloNetI18nModule } from '../../../shared-libs/cyclonet-i18n/src';
import { AUTHORIZA_TRANSLATIONS } from './shared/translations/authoriza-translations';

// En los imports del módulo:
CycloNetI18nModule.forRoot({
  appName: 'authoriza',
  translations: AUTHORIZA_TRANSLATIONS,
  defaultLanguage: 'en'
})