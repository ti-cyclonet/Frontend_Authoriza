import { NgClass, NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgClass, NgStyle],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css'
})
export class IconComponent {
  @Input() name!: string;
  @Input() size: string = '16';
  @Input() color: string = 'currentColor';
  @Input() backgroundColor: string | null = null;
  @Input() cssClass: string | null = null;
}
