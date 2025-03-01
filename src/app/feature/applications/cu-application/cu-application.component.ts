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

@Component({
  selector: 'app-cu-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-application.component.html',
  styleUrls: ['./cu-application.component.css'],
})
export class CuApplicationComponent implements OnInit, OnChanges {
  @Input() idApplication: string = '';
  applicationForm: FormGroup;
  nameAvailabilityMessage: string | null = null;
  isNameValid: boolean = false;
  isYellowVisible: boolean = true;
  isBlueVisible: boolean = false;
  isGreenVisible: boolean = false;
  showSendButton: boolean = false;
  showNextButton: boolean = true;
  @Output() applicationCreated = new EventEmitter<void>();
  imagePreview: string | ArrayBuffer | null = null;
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

  // Handle file selection
  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    this.isFileSelected = !!input.files?.length;

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

      // Update form control value
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
      const applicationData = new FormData();
      applicationData.append(
        'logo',
        this.fileTmp.fileRaw,
        this.fileTmp.fileName
      );

      const appName = this.applicationForm.get('applicationName')?.value;
      const appDescription = this.applicationForm.get('description')?.value;

      if (this.isEditMode && this.idApplication) {
        // Update existing application
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
        // Create new application
        if (appName) {
          applicationData.append('strName', appName);
        }
        if (appDescription) {
          applicationData.append('strDescription', appDescription);
        }

        this.applicationsService.createApplication(applicationData).subscribe({
          next: (response) => {
            console.log('Application created:', response);
            this.applicationCreated.emit(); // Emit event
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

  // Handle Previous button click
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
  }

  isPreviousDisabled(): boolean {
    return this.isYellowVisible;
  }

  isNextDisabled(): boolean {
    if (this.isYellowVisible) {
      return false;
    }
    if (this.isBlueVisible) {
      return !this.isFileSelected;
    }
    return true;
  }

  // Método para obtener el ID de la aplicación, si es necesario
  getApplicationId(): string | null {
    return this.idApplication;
  }
}
