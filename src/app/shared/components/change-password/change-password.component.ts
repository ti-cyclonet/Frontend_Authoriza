import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../services/user/user.service';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
})
export class ChangePasswordComponent implements OnInit {
  @Output() passwordChanged = new EventEmitter<void>();
  form!: FormGroup;
  /** Mostrar/ocultar cada contraseña. */
  show = { old: false, new: false, repeat: false };

  constructor(
    private fb: FormBuilder,
    private usersService: UserService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', Validators.required],
    });
  }

  get mismatch(): boolean {
    const repeat = this.form.get('repeatPassword');
    return !!repeat?.value && !!repeat?.touched && repeat.value !== this.form.get('newPassword')?.value;
  }

  /** 1-4 según largo y variedad de caracteres. */
  get strength(): number {
    const v: string = this.form.get('newPassword')?.value || '';
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
    return Math.max(1, s);
  }

  get strengthLabel(): string {
    const v: string = this.form.get('newPassword')?.value || '';
    if (v.length < 6) return `Faltan ${6 - v.length} caracteres`;
    return ['', 'Débil', 'Aceptable', 'Buena', 'Muy buena'][this.strength];
  }

  /** Como página, "Cancelar" vuelve atrás (en el modal lo cierra Bootstrap). */
  cancel(): void {
    this.form.reset();
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/change-password')) window.history.back();
  }

  closeModal(): void {
    // this.passwordChanged.emit();
  }

  onSubmit(): void {
    if (
      this.form.valid &&
      this.form.get('newPassword')?.value ===
        this.form.get('repeatPassword')?.value
    ) {
      const userId =
        sessionStorage.getItem('user_id') || localStorage.getItem('userId');
      const { oldPassword, newPassword } = this.form.value;

      this.usersService
        .changePassword(userId!, oldPassword, newPassword)
        .subscribe({
          next: (res) => {
            Swal.fire({
              icon: 'success',
              title: this.translationService.translate('changePassword.success.title'),
              text: this.translationService.translate('changePassword.success.message'),
              confirmButtonColor: '#3085d6',
            });
            this.form.reset();
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: this.translationService.translate('changePassword.error.title'),
              text: err.error?.message || this.translationService.translate('changePassword.error.message'),
              confirmButtonColor: '#d33',
            });
          },
        });
    } else {
      Swal.fire({
        icon: 'warning',
        title: this.translationService.translate('changePassword.warning.title'),
        text: this.translationService.translate('changePassword.warning.message'),
        confirmButtonColor: '#f0ad4e',
      });
    }
  }
}
