import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector">
      <button 
        class="btn btn-language"
        (click)="toggleLanguage()"
        [title]="currentLanguage === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'">
        <span class="flag">{{ currentLanguage === 'en' ? '🇺🇸' : '🇨🇴' }}</span>
        <span class="lang-text">{{ currentLanguage === 'en' ? 'EN' : 'ES' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .language-selector {
      display: flex;
      align-items: center;
    }
    .btn-language {
      border: 2px solid var(--sidebar-background-color);
      color: var(--sidebar-background-color);
      background: transparent;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      min-width: 70px;
      justify-content: center;
    }
    .btn-language:hover {
      background-color: var(--sidebar-background-color);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .btn-language:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .flag {
      font-size: 1rem;
      line-height: 1;
    }
    .lang-text {
      letter-spacing: 0.5px;
    }
  `]
})
export class LanguageSelectorComponent {
  currentLanguage: string = 'en';

  constructor(private translationService: TranslationService) {
    this.translationService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  toggleLanguage() {
    this.translationService.toggleLanguage();
  }
}