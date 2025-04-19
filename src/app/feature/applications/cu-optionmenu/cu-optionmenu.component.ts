import { Component, OnInit,} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-cuoptionmenu',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cu-optionmenu.component.html',
  styleUrls: ['./cu-optionmenu.component.css'],
})
export class CuOptionMenuComponent implements OnInit {
  optionMenuForm: FormGroup;
  isYellowVisible = true;
  isBlueVisible = false;
  isGreenVisible = false;

  constructor(private fb: FormBuilder) {
    this.optionMenuForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      url: ['', Validators.required],
      icon: ['', Validators.required],
      type: ['', Validators.required],
      order: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      submenu: ['', Validators.required],
    });
  }
  ngOnInit(): void {}

  onNext() {
    if (this.isYellowVisible) {
      this.isYellowVisible = false;
      this.isBlueVisible = true;
    } else if (this.isBlueVisible) {
      this.isBlueVisible = false;
      this.isGreenVisible = true;
    }
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

  isPreviousDisabled(): boolean {
    return this.isYellowVisible;
  }

  isNextDisabled(): boolean {
    if (this.isYellowVisible) {
      return !(this.optionMenuForm.get('name')?.valid && this.optionMenuForm.get('description')?.valid);
    }
    if (this.isBlueVisible) {
      return !(this.optionMenuForm.get('url')?.valid && this.optionMenuForm.get('icon')?.valid);
    }
    return true;
  }

  onSubmit() {
    if (this.optionMenuForm.valid) {
      console.log('Form submitted:', this.optionMenuForm.value);
    }
  }

  onCancel() {
    this.optionMenuForm.reset();
    this.isYellowVisible = true;
    this.isBlueVisible = false;
    this.isGreenVisible = false;
  }
}
