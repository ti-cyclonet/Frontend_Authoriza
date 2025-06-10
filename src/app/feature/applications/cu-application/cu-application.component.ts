// ... [Importaciones sin cambios] ...
import { Component, EventEmitter, Input, OnChanges, OnInit, Output,} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApplicationDTO, ApplicationsService } from '../../../shared/services/applications/applications.service';
import { ChangeDetectorRef } from '@angular/core';

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
    public applicationsService: ApplicationsService,
    private cdr: ChangeDetectorRef 
    
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

  get strTags() {
    return this.applicationForm.get('strTags') as FormArray;
  }

  createTag(): FormGroup {
    return this.fb.group({
      tag: ['', Validators.required],
    });
  }

  addTag(): void {
    this.strTags.push(this.createTag());
  }

  removeTag(index: number): void {
    this.strTags.removeAt(index);
  }

  // ✅ MÉTODO ACTUALIZADO
  loadApplicationData() {
    if (this.applicationsService.getIdApplication() === '') return;

    this.applicationsService
      .getApplicationById(this.applicationsService.getIdApplication())
      .subscribe({
        next: (applications: any) => {
          const application = applications[0];

          this.originalApplicationName = application.strName;
          this.applicationForm.patchValue({
            applicationName: application.strName,
            description: application.strDescription,
            logo: null,
          });

          if (!this.applicationForm.valid) {
            console.log('Formulario NO válido en modo edición.');
          }

          this.imageTmp = application.strUrlImage || '';
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
  
        // Validaciones
        if (!file.type.includes('image')) {
          console.error('El archivo seleccionado no es una imagen.');
          return;
        }
  
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          console.error('El archivo es demasiado grande. Máximo permitido: 10MB');
          return;
        }
  
        this.fileTmp = {
          fileRaw: file,
          fileName: file.name,
        };
  
        this.selectedFile = file;
        this.fileName = file.name ?? null;
  
        if (this.imagePreview) {
          URL.revokeObjectURL(this.imagePreview);
        }
        this.imagePreview = URL.createObjectURL(file);
        this.isFileChosen = true;
  
        this.applicationForm.get('logo')!.setValue(file);
        this.applicationForm.get('logo')!.updateValueAndValidity();
  
        // ✅ Obtener ID de aplicación
        const appId = this.idApplication || this.applicationsService.getIdApplication();
  
        // ✅ Asignar al DTO directamente en el mapa
        const dto = this.applicationsService.getApplicationDTOFor(appId);
        if (dto) {
          dto.imageFile = file;
          dto.strUrlImage = this.imagePreview;
          this.applicationsService.setApplicationDTOFor(appId, dto);
        }
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
  

  clearFile(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    this.imagePreview = null;
    this.isFileSelected = false;
    fileInput.value = '';
    this.applicationForm.get('logo')?.setValue(null);
    this.isFileChosen = false;
  }

  clearFileLocal() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageTmp = '';
    this.isFileSelected = false;
    this.applicationForm.get('logo')?.setValue(null);
    this.isFileChosen = false;
  }

  onNext() {
    const applicationName = this.applicationForm.get('applicationName')?.value;

    if (
      this.applicationsService.getEditMode() &&
      applicationName === this.originalApplicationName
    ) {
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
            setTimeout(() => this.cdr.detectChanges(), 0);
            if (this.selectedFile) {
              console.log(
                'SELECTED FILE: ',
                URL.createObjectURL(this.selectedFile)
              );
            } else {
              // console.log('No file selected.');
            }

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

  private advanceStep() {
    if (this.isYellowVisible) {
      this.isYellowVisible = false;
      this.isBlueVisible = true;
      this.cdr.detectChanges();
    } else if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isGreenVisible = true;
    }
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
      const tagsArray = this.strTags.controls.map((control) =>
        control.get('tag')?.value
      );
      const appName = this.applicationForm.get('applicationName')?.value;
      const generatedSlug = this.generateSlug(appName);
  
      const newApplicationDTO: ApplicationDTO = {
        id: 'temp-' + Math.random().toString(36).substr(2, 9),
        strName: this.applicationForm.get('applicationName')?.value,
        strDescription: this.applicationForm.get('description')?.value,
        strUrlImage: this.imagePreview || '',
        strSlug: generatedSlug,
        strTags: tagsArray,
        strState: 'TEMPORARY',
        strRoles: [],
        imageFile: this.selectedFile || undefined
      };
  
      this.applicationsService.addOrUpdateApplicationDTO(newApplicationDTO);
  
      // Agregamos propiedad 'isNew' para animación
      const newApplication = {
        id: newApplicationDTO.id!,
        strName: newApplicationDTO.strName,
        strDescription: newApplicationDTO.strDescription,
        strUrlImage: newApplicationDTO.strUrlImage,
        strSlug: newApplicationDTO.strSlug,
        strTags: newApplicationDTO.strTags,
        strState: 'TEMPORARY',
        strRoles: [],
        isNew: true,
      };
  
      this.applicationsService.addTemporaryApplication(newApplication);
  
      // Eliminamos el marcador isNew después de 3 segundos
      setTimeout(() => {
        this.applicationsService.markApplicationAsNotNew(newApplication.id);
      }, 3000);
  
      this.applicationCreated.emit();
      this.onCancel();
    }
  }
  

  private generateSlug(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '_').concat('_app');
  }

  onPrevious() {
    if (this.isGreenVisible) {
      this.isGreenVisible = false;
      this.isBlueVisible = true;
      setTimeout(() => this.cdr.detectChanges(), 0);
      this.cdr.detectChanges();
      if (this.selectedFile && !this.imagePreview) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    } else if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isYellowVisible = true;
    }
      // Restaurar imagen desde el DTO si existe
  const dto = this.applicationsService.getApplicationDTO();
  if (dto?.strUrlImage && dto?.imageFile) {
    this.imagePreview = dto.strUrlImage;
    this.selectedFile = dto.imageFile;
    this.isFileChosen = true;
    this.fileName = dto.imageFile.name;
  }

  }

  onCancel(): void {
    this.applicationForm.reset();
    this.isYellowVisible = true;
    this.isBlueVisible = false;
    this.showSendButton = false;
    this.showNextButton = true;
    this.imagePreview = null;
    this.selectedFile = null;
    this.isGreenVisible = false;
    this.fileName = '';
  }

  isPreviousDisabled(): boolean {
    return this.isYellowVisible;
  }

  isNextDisabled(): boolean {
    if (
      this.isYellowVisible &&
      this.applicationForm.get('applicationName')?.value &&
      this.applicationForm.get('description')?.value
    ) {
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
