import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { UserService } from "../../services/user/user.service";
import { HttpClient } from "@angular/common/http";
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
  imports: [ReactiveFormsModule, CommonModule, FormsModule]
})
export class ChangePasswordComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private usersService: UserService,  private cdr: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.form = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', Validators.required],
    });
  }


  onSubmit(): void {
      if (
        this.form.valid &&
        this.form.get('newPassword')?.value ===
          this.form.get('repeatPassword')?.value
      ) {
        console.log('User ID: ', sessionStorage.getItem('user_id') || localStorage.getItem('userId'));
        const userId =
          sessionStorage.getItem('user_id') || localStorage.getItem('userId');
        const { oldPassword, newPassword } = this.form.value;
  
        this.usersService.changePassword(userId!, oldPassword, newPassword)
        .subscribe({
          next: (res) => {
              Swal.fire({
                icon: 'success',
                title: '¡Contraseña actualizada!',
                text: res.message,
                confirmButtonColor: '#3085d6',
              });
  
              this.form.reset();
            },
            error: (err: any) => {
              Swal.fire({
                icon: 'error',
                title: 'Error al cambiar la contraseña',
                text: err.error?.message || 'Ocurrió un error inesperado.',
                confirmButtonColor: '#d33',
              });
            },
          });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseñas no coinciden',
          text: 'La nueva contraseña y su repetición no coinciden.',
          confirmButtonColor: '#f0ad4e',
        });
      }
    }
  
}
