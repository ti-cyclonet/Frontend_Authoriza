import { Component, ViewChild, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';
import { RolesService } from '../../../shared/services/roles/roles.service';
import { Rol } from '../../../shared/model/rol';
import { ApplicationsService } from '../../../shared/services/applications/applications.service';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-cu-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-rol.component.html',
  styleUrls: ['./cu-rol.component.scss']
})
export class CuRolComponent {
  @Output() rolCreado = new EventEmitter<Rol>();
  rolesForm: FormGroup;
  @ViewChild('modalRef') modalElement!: ElementRef;
  @Input() modalRef?: BsModalRef;
  @Input() appstrName: string | undefined;

  private modalInstance!: Modal;
  temporaryRoles: Rol[] = [];
  shouldCloseModal: boolean = false;

  constructor(private fb: FormBuilder, private rolesService: RolesService, private applicationsService: ApplicationsService) {
    this.rolesForm = this.fb.group({
      name: ['', Validators.required],
      description1: ['', Validators.required],
      description2: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.rolesForm.invalid) {
      this.rolesForm.markAllAsTouched();
      return;
    }
  
    const name = this.rolesForm.get('name')?.value;
  
    // Validar si ya existe el nombre en el arreglo temporal
    const existsInTemp = this.temporaryRoles.some(role => role.strName === name);
    if (existsInTemp) {
      this.rolesForm.get('name')?.setErrors({ alreadyExists: true });
      return;
    }
  
    this.rolesService.checkApplicationName(name).subscribe((isAvailable) => {
      if (isAvailable) {
        const newRole: Rol = {
          id: this.generateTempId(),
          strName: name,
          strDescription1: this.rolesForm.get('description1')?.value || '',
          strDescription2: this.rolesForm.get('description2')?.value || '',
          strState: 'TEMPORARY',
          menuOptions: [] 
        };

        // Guarda temporalmente en el servicio
        this.applicationsService.addTemporaryRole(newRole);
        this.rolCreado.emit(newRole);
        
        this.onCancel();
        this.shouldCloseModal = true;
      } else {
        this.rolesForm.get('name')?.setErrors({ notAvailable: true });
      }
    });
  }
  
  // Método auxiliar para generar un ID temporal
  private generateTempId(): string {
    return 'temp-' + Math.random().toString(36).substr(2, 9);
  }
  
  onCancel() {
    this.rolesForm.reset();
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.modalRef?.hide()
  }

}
