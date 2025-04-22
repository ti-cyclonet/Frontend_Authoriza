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
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApplicationsService } from '../../../shared/services/applications/applications.service';
import { Application } from '../../../shared/model/application.model';

@Component({
  selector: 'app-cu-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-application.component.html',
  styleUrls: ['./cu-application.component.css'],
})
export class CuApplicationComponent implements OnInit, OnChanges {  
  @Output() newApplication = new EventEmitter<any>();
  @Input() idApplication: string = '';
  applicationsList: any[] = [];
  applicationForm: FormGroup;
  nameAvailabilityMessage: string | null = null;
  isNameValid: boolean = false;
  isYellowVisible: boolean = true;
  isBlueVisible: boolean = false;
  isGreenVisible: boolean = false;
  showSendButton: boolean = false;
  showNextButton: boolean = true;
  @Output() applicationCreated = new EventEmitter<void>();
  imagePreview: string | null = null; 
  selectedFile: File | null = null;
  fileName: string | null = null;
  fileTmp: any;
  isEditMode: boolean = false;
  originalApplicationName: string = '';
  isFileChosen: boolean = false;
  imageTmp: string = '';
  isTagsVisible = false;
  isFileSelected = false;

  constructor(
    private fb: FormBuilder,
    public applicationsService: ApplicationsService
  ) {
    this.applicationForm = this.fb.group({
      applicationName: ['', Validators.required],
      description: ['', Validators.required],
      logo: [null, Validators.required],
      strTags: this.fb.array([this.createTag()]),
    });
    this.fileName = '';
  }

  ngOnInit() {
    if (this.applicationsService.getIdApplication()) {
      this.isEditMode = true;
      this.loadApplicationData();
    }
  }

  ngOnChanges() {
    if (this.idApplication) {
      this.applicationsService.editMode = true;
      this.loadApplicationData();
    }
  }

  // Get tags form array
  get strTags() {
    return this.applicationForm.get('strTags') as FormArray;
  }

  // Create a new tag
  createTag(): FormGroup {
    return this.fb.group({
      tag: ['', Validators.required],
    });
  }

  // Add a new tag
  addTag(): void {
    this.strTags.push(this.createTag());
  }

  // Remove a tag
  removeTag(index: number): void {
    this.strTags.removeAt(index);
  }

  // Load application data when editing
  loadApplicationData() {
    if (this.applicationsService.getIdApplication() == '') return;

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

  onFileSelected(event: Event): void {
    try {
      const input = event.target as HTMLInputElement;
      this.isFileSelected = !!input.files?.length;
  
      if (input.files && input.files.length > 0) {
        const file = input.files[0];        
  
        // Validar que el archivo sea una imagen
        if (!file.type.includes('image')) {
          console.error('El archivo seleccionado no es una imagen.');
          return;
        }
  
        // Validar tamaño máximo de archivo (ejemplo: 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB en bytes
        if (file.size > maxSize) {
          console.error('El archivo es demasiado grande. Máximo permitido: 2MB');
          return;
        }
  
        this.fileTmp = {
          fileRaw: file,
          fileName: file.name,
        };
  
        this.selectedFile = file;
        this.fileName = file.name ?? null;
  
        // Revocar la URL anterior para evitar fugas de memoria
        if (this.imagePreview) {
          URL.revokeObjectURL(this.imagePreview);
        }
  
        this.imagePreview = URL.createObjectURL(file);
        this.isFileChosen = true;

        // ✅ Guardar la imagen y archivo en el DTO parcialmente
        this.applicationsService.updateApplicationDTO({
          strUrlImage: this.imagePreview,
          imageFile: file
        });
  
        // Actualizar solo el nombre en el formulario
        this.applicationForm.patchValue({
          logo: file.name,
        });
  
        // Preparar el archivo para el backend
        const formData = new FormData();
        formData.append('logo', file);
        // Aquí puedes enviar formData a tu backend si es necesario
      } else {
        this.selectedFile = null;
        this.fileName = null;
        this.imagePreview = null;
        this.isFileChosen = false;
  
        this.applicationForm.patchValue({
          logo: null,
        });
      }
    } catch (error) {
      console.error('Error al seleccionar el archivo:', error);
    }
  }

  // Clear file input
  clearFile(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    this.imagePreview = null;
    this.isFileSelected = false;
    fileInput.value = '';
    this.applicationForm.get('logo')?.setValue(null);
    this.isFileChosen = false;
  }

  // Clear file locally
  clearFileLocal() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageTmp = '';
    this.isFileSelected = false;
    this.applicationForm.get('logo')?.setValue(null);
    this.isFileChosen = false;
  }

  // Maneja el clic en el botón Next
  onNext() {
    const applicationName = this.applicationForm.get('applicationName')?.value;
  
    if (this.applicationsService.getEditMode() && applicationName === this.originalApplicationName) {
      this.advanceStep();
      this.nameAvailabilityMessage = null;
      return;
    }
  
    this.applicationsService.checkApplicationName(applicationName).subscribe({
      next: (isAvailable) => {
        if (isAvailable) {
          if (this.isYellowVisible) {
            this.isYellowVisible = false;
            this.isBlueVisible = true;
            if (this.selectedFile) {
              console.log('SELECTED FILE: ', URL.createObjectURL(this.selectedFile));
            } else {
              console.log('No file selected.');
            }
  
            // Restaurar la imagen previa si ya se había seleccionado antes
            if (this.selectedFile) {
              this.imagePreview = URL.createObjectURL(this.selectedFile);
            }
          } else if (this.isBlueVisible) {
            this.isBlueVisible = false;
            this.isGreenVisible = true;
          }
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
  
  // Avanza al siguiente paso
  private advanceStep() {
    if (this.isYellowVisible) {
      this.isYellowVisible = false;
      this.isBlueVisible = true;
    } else if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isGreenVisible = true;
    }
  }

  // Handle form submission
  onSubmit(): void {
    if (this.applicationForm.valid) {
      const tagsArray = this.strTags.controls.map(control => control.get('tag')?.value);
      const appName = this.applicationForm.get('applicationName')?.value;
      const generatedSlug = this.generateSlug(appName);
      const newApplication: Application = {
        id: 'temp-' + Math.random().toString(36).substr(2, 9),
        strName: this.applicationForm.get('applicationName')?.value,
        strDescription: this.applicationForm.get('description')?.value,
        strUrlImage: this.imagePreview || '',
        strSlug: generatedSlug,
        strTags: tagsArray,
        strState: 'TEMPORARY',
        strRoles: []
      };

      this.applicationsService.updateApplicationDTO({
        strName: this.applicationForm.get('applicationName')?.value,
        strDescription: this.applicationForm.get('description')?.value,
        strUrlImage: this.imagePreview || '',
        strSlug: generatedSlug,
        strTags: tagsArray,
        strState: 'TEMPORARY',
        strRoles: []
      });
  
      // Agregar la nueva aplicación al array local
      this.applicationsService.addTemporaryApplication(newApplication);
  
      // Emitir evento si es necesario
      this.applicationCreated.emit();
  
      this.onCancel();
    }
  }

  private generateSlug(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .concat('_app');
  }  

  onPrevious() {
    if (this.isGreenVisible) {
      this.isGreenVisible = false;
      this.isBlueVisible = true;
    } else if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isYellowVisible = true;
    }
  }

  // Cancel the form
  onCancel(): void {
    this.applicationForm.reset();
    this.isYellowVisible = true;
    this.isBlueVisible = false;
    this.showSendButton = false;
    this.showNextButton = true;
    this.imagePreview = null;
    this.selectedFile = null;
    this.isGreenVisible  = false;
    this.fileName     = '';
  }

  isPreviousDisabled(): boolean {
    return this.isYellowVisible;
  }

  isNextDisabled(): boolean {
    if (this.isYellowVisible && this.applicationForm.get('applicationName')?.value && this.applicationForm.get('description')?.value) {
      return false;
    }
    if (this.isBlueVisible) {
      return !this.isFileSelected;
    }
    return true;
  }

  getApplicationId(): string | null {
    return this.idApplication;
  }
}
