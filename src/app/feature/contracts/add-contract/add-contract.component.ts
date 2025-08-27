import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  PaginatedResponse,
  UserService,
} from '../../../shared/services/user/user.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/model/user';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-add-contract',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.css',
})
export class AddContractComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() close2 = new EventEmitter<void>();

  step1: boolean = true;
  step2: boolean = false;
  step3: boolean = false;

  showStp1: boolean = false;
  showStp2: boolean = false;
  showStp3: boolean = false;

  allUsers: User[] = [];
  usersWithoutDependency: User[] = [];
  selectedUser: string | null = null;

  currentPage: number = 0;
  totalUsers: number = 0;
  readonly PAGE_SIZE = 5;
  totalPages: number = 0;

  search = new FormControl<string>('', { nonNullable: true });
  searchTerm = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsersWithoutDependency();

    this.search.valueChanges.subscribe((value) => {
      this.searchTerm = value || '';
      this.currentPage = 1;
      this.cdr.detectChanges();
    });
  }

  loadUsersWithoutDependency(): void {
    this.userService.getIndependentUsers().subscribe({
      next: (users: User[]) => {
        this.usersWithoutDependency = users;
        this.totalUsers = users.length;

        this.totalPages = Math.ceil(this.totalUsers / this.PAGE_SIZE);
        this.currentPage = 1;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios independientes:', err);
      },
    });
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredUsers.slice(start, start + this.PAGE_SIZE);
  }

  get filteredUsers(): User[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) return this.usersWithoutDependency;

    return this.usersWithoutDependency.filter((u) => {
      const fields: string[] = [];

      fields.push(u.strUserName ?? '');

      if (u.basicData?.naturalPersonData) {
        const np = u.basicData.naturalPersonData;
        fields.push(np.firstName ?? '');
        fields.push(np.secondName ?? '');
        fields.push(np.firstSurname ?? '');
        fields.push(np.secondSurname ?? '');
      }

      if (u.basicData?.legalEntityData) {
        const le = u.basicData.legalEntityData;
        fields.push(le.businessName ?? '');
      }

      return fields.some((f) => f.toLowerCase().includes(q));
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
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
