import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
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
export class CuApplicationComponent implements OnInit, OnChanges {
  @Input() idApplication: number = 0; // Recibe el idApplication desde el componente padre
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
  isEditMode: boolean = false;  
  originalApplicationName: string = '';
  isFileChosen: boolean = false; // Controla si hay un archivo seleccionado
  imageTmp: string = '';

  constructor(
    private fb: FormBuilder,
    public applicationsService: ApplicationsService
  ) {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: [null, Validators.required],
    });
    this.fileName = '';
  }

  ngOnInit() {
    if (this.applicationsService.getIdApplication()) {
      this.isEditMode = true;
      this.loadApplicationData();
    }

    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: [null, this.isEditMode ? null : Validators.required],
    });
  }

  ngOnChanges() {
    if (this.idApplication) {
      this.applicationsService.editMode = true;
      this.loadApplicationData();
    }
  }

  loadApplicationData() {
    if (this.applicationsService.getIdApplication() == 0) return;

    this.applicationsService
      .getApplicationById(this.applicationsService.getIdApplication())
      .subscribe({
        next: (applications: any) => {
          const application = applications[0];
          this.originalApplicationName = application.strname;
          this.applicationForm.patchValue({
            applicationName: application.strname,
            description: application.strdescription,
            logo: null,
          });

          if (!this.applicationForm.valid) {
            console.log('Formulario NO válido en modo edición.');
          }

          this.imageTmp = application.strlogo;
          this.isFileChosen = !!this.imageTmp;

          if (this.isEditMode && this.imageTmp) {
            this.applicationForm.get('logo')?.clearValidators();
            this.applicationForm.get('logo')?.updateValueAndValidity();
          }

          this.applicationForm.markAsTouched();
          this.applicationForm.markAsDirty();

          if (this.applicationForm.valid) {
            console.log('Formulario válido en modo edición.');
          }
        },
        error: (error) => {
          console.error('Error loading application data:', error);
        },
      });
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileTmp = {
        fileRaw: file,
        fileName: file.name,
      };

      this.selectedFile = file;
      this.fileName = this.selectedFile.name ?? null;
      this.imagePreview = URL.createObjectURL(this.selectedFile);
      this.isFileChosen = true;
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
  }

  clearFile(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    this.imagePreview = null;
    fileInput.value = ''; 
    this.applicationForm.get('logo')?.setValue(null);
    this.isFileChosen = false;
  }

  clearFileLocal() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageTmp = '';
    this.applicationForm.get('logo')?.setValue(null);
    this.isFileChosen = false;
  }

  onNext() {
    const applicationName = this.applicationForm.get('applicationName')?.value;

    // Si estamos en modo edición y el nombre no ha cambiado, proceder sin verificar
    if (
      this.applicationsService.getEditMode() &&
      applicationName === this.originalApplicationName
    ) {
      this.isYellowVisible = false;
      this.isBlueVisible = true;
      this.nameAvailabilityMessage = null;
      return; // Salir de la función sin verificar disponibilidad
    }

    // Verificar disponibilidad del nombre de la aplicación
    this.applicationsService.checkApplicationName(applicationName).subscribe({
      next: (isAvailable) => {
        if (isAvailable) {
          this.isYellowVisible = false;
          this.isBlueVisible = true;
          this.nameAvailabilityMessage = null;
        } else {
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
        'logo',
        this.fileTmp.fileRaw,
        this.fileTmp.fileName
      );

      const appName = this.applicationForm.get('applicationName')?.value;
      const appDescription = this.applicationForm.get('description')?.value;

      if (this.isEditMode && this.idApplication) {
        // Actualizar la aplicación existente
        this.applicationsService
          .updateApplication(this.idApplication, applicationData)
          .subscribe({
            next: (response) => {
              console.log('Application updated:', response);
              this.onCancel();
            },
            error: (error) => {
              console.error('Error updating application:', error);
            },
          });
      } else {
        // Crear nueva aplicación
        if (appName) {
          applicationData.append('strName', appName);
        }
        if (appDescription) {
          applicationData.append('strDescription', appDescription);
        }

        this.applicationsService.createApplication(applicationData).subscribe({
          next: (response) => {
            console.log('Application created:', response);
            this.applicationCreated.emit(); // Emitir el evento
            this.onCancel();
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
    this.imagePreview = null;
    this.clearFile(this.fileTmp);
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

  // Método para obtener el ID de la aplicación, si es necesario
  getApplicationId(): number | null {
    return this.idApplication;
  }
}
