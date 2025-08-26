import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../shared/services/user/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-contract',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.css',
})
export class AddContractComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() close2 = new EventEmitter<void>();
  checkingName = false;
  nameExists = false;
  disabled = true;
  showConfigurationRecord = false;

  step1: boolean = true;
  step2: boolean = false;
  step3: boolean = false; 
  
  showStp1: boolean = false;
  showStp2: boolean = false;
  showStp3: boolean = false;

  totalRoles: number = 0;
  currentPage: number = 0;
  readonly PAGE_SIZE = 5;
  Math = Math;

  usersWithoutDependency: any[] = [];
  selectedUser: string | null = null;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsersWithoutDependency()
  }

  loadUsersWithoutDependency() {
    this.userService.getIndependentUsers().subscribe({
      next: (users) => {
        this.usersWithoutDependency = users;        
      },
      error: (error) => {
        console.error('Error loading users without dependency:', error);
      }
    });
  }

  goToStep(direction: number) {
  if (direction === -1) {
    if (this.step3) {
      this.step3 = false;
      this.step2 = true;
      this.step1 = false;
      this.showStepIcons(true, false, false);
    } else if (this.step2) {
      this.step2 = false;
      this.step1 = true;
      this.step3 = false;
      this.showStepIcons(false, false, false);
    }
  } else {
    if (this.step1) {
      this.step1 = false;
      this.step2 = true;
      this.step3 = false;
      this.showStepIcons(true, false, false);
    } else if (this.step2) {
      this.step2 = false;
      this.step3 = true;
      this.step1 = false;
      this.showStepIcons(true, true, false);
    }
  }
}


  showStepIcons(stp1: boolean, stp2: boolean, stp3: boolean): void {
    this.showStp1 = stp1;
    this.showStp2 = stp2;
    this.showStp3 = stp3;
  }

  onCancel(): void {
    this.close.emit();
  }
}
