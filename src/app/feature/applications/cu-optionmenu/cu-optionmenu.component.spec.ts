import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuOptionMenuComponent } from './cu-optionmenu.component';

describe('CuOptionmenuComponent', () => {
  let component: CuOptionMenuComponent;
  let fixture: ComponentFixture<CuOptionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuOptionMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuOptionMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
