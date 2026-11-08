import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';
import { TranslationService } from '../../services/translation.service';

describe('BottomNavComponent', () => {
  const opcion = (strName: string, strDescription: string, strUrl: string) => ({ strName, strDescription, strUrl } as any);

  it('muestra las opciones traducidas, no su clave interna (homeAuthoriza)', () => {
    TestBed.configureTestingModule({ imports: [BottomNavComponent], providers: [provideRouter([])] });
    TestBed.inject(TranslationService).setLanguage('es');
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.componentInstance.optionsMenu = [
      opcion('homeAuthoriza', 'Home', '/home'),
      opcion('usersAuthoriza', 'Users', '/users'),
      opcion('contractsAuthoriza', 'Contracts', '/contracts'),
      opcion('packagesAuthoriza', 'Packages', '/packages'),
      opcion('settingsAuthoriza', 'Settings', '/setup'),
    ];
    fixture.detectChanges();
    const textos = Array.from(fixture.nativeElement.querySelectorAll('.bn-item span') as NodeListOf<HTMLElement>).map((s) => s.textContent!.trim());
    expect(textos).toEqual(['Inicio', 'Usuarios', 'Contratos', 'Más']);
    expect(fixture.componentInstance.label(opcion('xAuthoriza', 'Otra cosa', '/x'))).toBe('Otra cosa');
  });
});
