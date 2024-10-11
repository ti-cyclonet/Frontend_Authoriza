import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApplicationsService } from '../../../shared/services/applications/applications.service';

@Component({
  selector: 'app-cu-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-application.component.html',
  styleUrls: ['./cu-application.component.css'],
})
export class CuApplicationComponent implements OnInit {
  applicationForm: FormGroup;
  nameAvailabilityMessage: string | null = null;
  isNameValid: boolean = false;
  isYellowVisible: boolean = true; // Inicializa el cuadro amarillo visible
  isBlueVisible: boolean = false; // Inicializa el cuadro azul oculto
  showSendButton: boolean = false; // Inicializa el botón "Send" oculto
  showNextButton: boolean = true; // Inicializa el botón "Next" visible

  constructor(
    private fb: FormBuilder,
    private applicationsService: ApplicationsService
  ) {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: ['', Validators.required], // Asegúrate de validar el campo logo también
    });
  }

  ngOnInit() {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: ['', Validators.required],
    });
  }

  // Validar los campos antes de avanzar al cuadro azul
  // onNext(): void {
  //   const applicationNameControl = this.applicationForm.get('applicationName');
  //   const descriptionControl = this.applicationForm.get('description');

  //   // Verifica si ambos campos son válidos
  //   if (applicationNameControl?.valid && descriptionControl?.valid) {
  //     this.isYellowVisible = false; // Oculta el cuadro amarillo
  //     this.isBlueVisible = true; // Muestra el cuadro azul
  //     this.showSendButton = true; // Muestra el botón "Send"
  //     this.showNextButton = false; // Oculta el botón "Next"
  //   } else {
  //     // Marca los controles como tocados para mostrar los errores
  //     applicationNameControl?.markAsTouched();
  //     descriptionControl?.markAsTouched();
  //     console.log('Please complete the required fields.');
  //   }
  // }

  onNext() {
    if (this.isYellowVisible) {
      this.isYellowVisible = false;
      this.isBlueVisible = true;
    }
  }

  // Resetear el formulario y cerrar la ventana modal
  onSubmit(): void {
    if (this.applicationForm.valid) {
      const applicationData = {
        strName: this.applicationForm.get('applicationName')?.value,
        strDescription: this.applicationForm.get('description')?.value,
        strLogo: this.applicationForm.get('logo')?.value
      };

      // Llamamos al método para crear la aplicación
      this.applicationsService.createApplication(applicationData).subscribe({
        next: (response) => {
          console.log('Application created:', response);
          this.applicationForm.reset(); // Resetea el formulario
        },
        error: (error) => {
          console.error('Error creating application:', error);
          if (error.status === 409) {
            this.nameAvailabilityMessage = 'Application name already exists.';
          } else {
            this.nameAvailabilityMessage = 'Error creating application.';
          }
        }
      });
    }
  }

  // Método para el botón "Previous"
  // onPrevious(): void {
  //   this.isYellowVisible = true; // Muestra el cuadro amarillo
  //   this.isBlueVisible = false; // Oculta el cuadro azul
  //   this.showSendButton = false; // Oculta el botón "Send"
  //   this.showNextButton = true; // Muestra el botón "Next"
  // }
  onPrevious() {
    if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isYellowVisible = true;
    }
  }

  onCancel(): void {
    this.applicationForm.reset(); // Resetea el formulario
    this.isYellowVisible = true; // Muestra nuevamente el cuadro amarillo
    this.isBlueVisible = false; // Oculta el cuadro azul
    this.showSendButton = false; // Oculta el botón "Send"
    this.showNextButton = true; // Muestra el botón "Next"
  }

  // Método para verificar si el botón "Previous" debe estar habilitado
  isPreviousDisabled(): boolean {
    return this.isYellowVisible; // Deshabilitar si el cuadro amarillo está visible
  }

  // Método para verificar si el botón "Next" debe estar habilitado
  isNextDisabled(): boolean {
    return !(this.applicationForm.get('applicationName')?.valid && this.applicationForm.get('description')?.valid); // Deshabilitar si los campos no son válidos
  }
}
