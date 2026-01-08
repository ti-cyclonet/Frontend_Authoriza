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
