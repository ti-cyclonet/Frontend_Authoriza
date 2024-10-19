import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  isYellowVisible: boolean = true;
  isBlueVisible: boolean = false;
  showSendButton: boolean = false;
  showNextButton: boolean = true;
  @Output() applicationCreated = new EventEmitter<void>();
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null; // Para almacenar el archivo seleccionado
  fileName: string | null = null; // Para almacenar el nombre del archivo


  constructor(
    private fb: FormBuilder,
    private applicationsService: ApplicationsService
  ) {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: [null, Validators.required]
    });
    this.fileName = '';
  }

  ngOnInit() {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: [null, Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name; // Guardar el nombre del archivo
      this.imagePreview = URL.createObjectURL(this.selectedFile); // Para la vista previa

      // Actualiza el valor del control de formulario
      this.applicationForm.patchValue({
        logo: this.selectedFile // Asignar el archivo al control
      });
    } else {
      this.selectedFile = null;
      this.fileName = null; // Reiniciar el nombre si no hay archivo
      this.applicationForm.patchValue({
        logo: null // Reiniciar el control
      });
    }
  }

  clearFile(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    this.imagePreview = null;
    fileInput.value = ''; // Resetea el input
    this.applicationForm.get('logo')?.setValue(null); // Resetea el control del formulario
  }

  onNext() {
    const applicationName = this.applicationForm.get('applicationName')?.value;

    // Llama al servicio para verificar el nombre de la aplicación
    this.applicationsService.checkApplicationName(applicationName).subscribe({
      next: (isAvailable) => {
        if (isAvailable) {
          // Si el nombre está disponible, avanzar al siguiente paso
          this.isYellowVisible = false;
          this.isBlueVisible = true;
          this.nameAvailabilityMessage = null; // Limpiar mensajes anteriores
        } else {
          // Si el nombre ya está registrado, mostrar mensaje
          this.nameAvailabilityMessage = 'Application name is already taken.';
        }
      },
      error: (error) => {
        console.error('Error checking application name:', error);
        this.nameAvailabilityMessage = 'Error checking name availability.';
      },
    });
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
      const applicationData = new FormData();

      applicationData.append(
        'strName',
        this.applicationForm.get('applicationName')?.value
      );
      applicationData.append(
        'strDescription',
        this.applicationForm.get('description')?.value
      );

      // Agrega el archivo del formulario si ha sido seleccionado
      const logoFile = this.applicationForm.get('logo')?.value;
      if (logoFile) {
        applicationData.append('strLogo', logoFile, logoFile.name);
      }

      console.log('FORMDATA: ', applicationData);

      // Llamada al servicio
      this.applicationsService.createApplication(applicationData).subscribe({
        next: (response) => {
          console.log('Application created:', response);
          this.onCancel();
          // Aquí debes emitir el evento de aplicación creada, si es necesario
        },
        error: (error) => {
          console.error('Error creating application:', error);
          if (error.status === 409) {
            this.nameAvailabilityMessage = 'Application name already exists.';
          } else {
            this.nameAvailabilityMessage = 'Error creating application.';
          }
        },
      });
    }
  }

  onPrevious() {
    if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isYellowVisible = true;
    }
  }

  onCancel(): void {
    this.applicationForm.reset();
    this.isYellowVisible = true;
    this.isBlueVisible = false;
    this.showSendButton = false;
    this.showNextButton = true;
  }

  isPreviousDisabled(): boolean {
    return this.isYellowVisible;
  }

  isNextDisabled(): boolean {
    return !(
      this.applicationForm.get('applicationName')?.valid &&
      this.applicationForm.get('description')?.valid
    );
  }
}
