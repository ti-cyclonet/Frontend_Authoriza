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
  fileTmp: any;



  constructor(
    private fb: FormBuilder,
    private applicationsService: ApplicationsService
  ) {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: [null, Validators.required],
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

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileTmp = {
        fileRaw: file,
        fileName: file.name
      }
      console.log('ARCHIVO: ', this.fileTmp);

      this.selectedFile = file;
      this.fileName = this.selectedFile.name ?? null;
      this.imagePreview = URL.createObjectURL(this.selectedFile);
      // Actualiza el valor del control de formulario
      this.applicationForm.patchValue({
        logo: this.selectedFile,
      });
    } else {
      this.selectedFile = null;
      this.fileName = null;
      this.applicationForm.patchValue({
        logo: null,
      });
    }
    console.log('SELECTED FILE: ', this.selectedFile);
  }

  clearFile(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    this.imagePreview = null;
    fileInput.value = ''; // Resetea el input
    this.applicationForm.get('logo')?.setValue(null);
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
      applicationData.append('logo', this.fileTmp.fileRaw, this.fileTmp.fileName);

      const appName = this.applicationForm.get('applicationName')?.value;
      const appDescription = this.applicationForm.get('description')?.value;
      if (appName) {
        applicationData.append('strName', appName);
      } else {
        console.warn('Application name is empty or invalid.');
      }
      if (appDescription) {
        applicationData.append('strDescription', appDescription);
      } else {
        console.warn('Application description is empty or invalid.');
      }


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
