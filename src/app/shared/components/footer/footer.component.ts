import { Component } from '@angular/core';
import { NAME_APP_SHORT } from '../../../config/config';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  nombreApp = NAME_APP_SHORT;

}
