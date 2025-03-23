import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cu-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-rol.component.html',
  styleUrls: ['./cu-rol.component.scss']
})
export class CuRolComponent {
  applicationForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.applicationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description1: ['', [Validators.required, Validators.maxLength(100)]],
      description2: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
      console.log('Formulario enviado:', this.applicationForm.value);
    } else {
      console.log('Formulario inválido');
    }
  }
}
