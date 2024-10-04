import { PrimeNGConfig } from 'primeng/api';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Extra, Plan } from '../../../../assets/om/om';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EXTRAS, PLANS } from '../../../../assets/data/form-data';
import { NgbCarousel, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-cu-application',
  standalone: true,
  imports: [CommonModule, NgbCarouselModule, ReactiveFormsModule, ListboxModule, ButtonModule, DialogModule],
  templateUrl: './cu-application.component.html',
  styleUrl: './cu-application.component.css',
})
export class CuApplicationComponent implements OnInit {
  @ViewChild(NgbCarousel) carousel: NgbCarousel = {} as NgbCarousel;

  get getTotal(): number {
    const field = this.planForm.get('yearly')?.value
      ? 'yearPrice'
      : 'monthPrice';

    const basePlan = this.planForm.get('plan')?.value;
    const extras = this.addOnsForm.get('addOns')?.value;
    const extraPrice = extras?.reduce((acc, curr) => acc + curr[field], 0) || 0;
    return basePlan ? basePlan[field] + extraPrice : 0;
  }

  public carouselIndex = 0;
  public btnDisabled = false;
  public readonly availablePlans: Plan[] = PLANS;
  public readonly availableAddOns: Extra[] = EXTRAS;

  // NG reactive forms
  public infoForm;
  public planForm;
  public addOnsForm;

  public displayDialog = false;

  constructor(private primengConfig: PrimeNGConfig, private fb: FormBuilder) {
    // STEP 1 - info
    this.infoForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(new RegExp('^\\+?\\d{9,11}$')),
        ],
      ],
    });

    // STEP 2 - plan
    this.planForm = this.fb.group({
      plan: [this.availablePlans[0], Validators.required],
      yearly: [false],
    });

    // STEP 3 - add ons
    this.addOnsForm = this.fb.group({
      addOns: [[] as Extra[]],
    });
  }

  ngOnInit() {
    this.primengConfig.ripple = true;
  }

  // carousel controls -------------------
  onSlideStart(): void {
    this.btnDisabled = true;
  }

  onSlideEnd(): void {
    this.btnDisabled = false;
  }

  onBack(): void {
    this.carouselIndex--;
    this.carousel.prev();
  }

  onNext(): void {
    this.carouselIndex++;
    this.carousel.next();
  }

  onReset(): void {
    this.carousel.select('info');
    this.carouselIndex = 0;

    // reset forms
    this.infoForm.reset();
    this.planForm.reset({
      plan: this.availablePlans[0],
      yearly: false,
    });
    this.addOnsForm.reset();
  }

  changePlan(event: MouseEvent): void {
    // prevent default and go to plan form
    event.preventDefault();
    this.carousel.select('plan');
    this.carouselIndex = 1;
  }
}
