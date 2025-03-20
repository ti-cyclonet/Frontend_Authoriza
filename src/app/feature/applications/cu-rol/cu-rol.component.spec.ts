import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuRolComponent } from './cu-rol.component';

describe('CuRolComponent', () => {
  let component: CuRolComponent;
  let fixture: ComponentFixture<CuRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuRolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
