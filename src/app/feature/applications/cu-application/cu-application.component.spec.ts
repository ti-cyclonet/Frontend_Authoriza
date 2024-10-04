import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuApplicationComponent } from './cu-application.component';

describe('CuApplicationComponent', () => {
  let component: CuApplicationComponent;
  let fixture: ComponentFixture<CuApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuApplicationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
