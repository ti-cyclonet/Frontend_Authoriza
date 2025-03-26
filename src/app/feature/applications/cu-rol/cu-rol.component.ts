import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-cu-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-rol.component.html',
  styleUrls: ['./cu-rol.component.scss']
})
export class CuRolComponent {
  applicationForm: FormGroup;
  @ViewChild('modalRef') modalElement!: ElementRef;
  private modalInstance!: Modal; // Instancia del modal

  constructor(private fb: FormBuilder) {
    this.applicationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description1: ['', [Validators.required, Validators.maxLength(100)]],
      description2: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }
  ngAfterViewInit() {
    if (this.modalElement) {
      this.modalInstance = new Modal(this.modalElement.nativeElement);
    }
  }
  onSubmit(): void {
    if (this.applicationForm.valid) {
      console.log('Formulario enviado:', this.applicationForm.value);
      this.applicationForm.reset(); // Limpia el formulario después de enviar
      this.cerrarModal(); // Cierra la modal
    } else {
      console.log('Formulario inválido');
      this.applicationForm.markAllAsTouched(); // Muestra errores en todos los campos
  
    }
  }
  onCancel() {
    this.applicationForm.reset(); // Limpia el formulario
    this.cerrarModal();
  }
  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }
}
