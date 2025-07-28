import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { DESCRIPTION_APP } from '../../../config/config';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChangePasswordComponent } from '../change-password/change-password.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ChangePasswordComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  providers: [AuthService],
})
export class HeaderComponent implements OnInit {
  userName: string | null = null;
  userEmail: string | null = null;
  userRol: string | null = null;
  userRolDescription: string | null = null;
  userImage: string | null = null;
  private _isSidebarVisible: boolean = false;

  @Input()
  set isSidebarVisible(value: boolean) {
    this._isSidebarVisible = value;
  }
  get isSidebarVisible(): boolean {
    return this._isSidebarVisible;
  }

  @Output() sidebarToggle = new EventEmitter<void>();

  nombreApp = DESCRIPTION_APP;

  form!: FormGroup;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const firstName = sessionStorage.getItem('user_firstName');
      const secondName = sessionStorage.getItem('user_secondName');
      const businessName = sessionStorage.getItem('user_businessName');
      this.userName = businessName
        ? businessName
        : `${firstName ?? ''} ${secondName ?? ''}`.trim();
      this.userEmail = sessionStorage.getItem('user_email');
      this.userRol = sessionStorage.getItem('user_rol');
      this.userRolDescription = sessionStorage.getItem('user_rolDescription');
      this.userImage = sessionStorage.getItem('user_image');
    }
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initDropdowns();
  }

  async initDropdowns(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const dropdownTriggerList = Array.from(
        document.querySelectorAll('[data-bs-toggle="dropdown"]')
      );

      const bootstrap = await import('bootstrap');

      dropdownTriggerList.forEach((dropdownTriggerEl) => {
        new bootstrap.Dropdown(dropdownTriggerEl);
      });

      console.log('[HeaderComponent] Dropdowns reinicializados');
    }
  }
  
  onToggleSidebar(): void {
    this._isSidebarVisible = !this._isSidebarVisible;
    this.sidebarToggle.emit();
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('[HeaderComponent] Cerrando sesión...');
      sessionStorage.clear();
    }

    this.router.navigate(['/login']).then(() => {
      setTimeout(() => {
        console.log('[HeaderComponent] Página recargada después de logout.');
        window.location.reload();
      }, 100);
    });
  }
  
}
