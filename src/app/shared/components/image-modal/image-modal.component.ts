import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-modal',
  standalone: true,
  imports: [CommonModule], 
  template: `
    <div class="modal-backdrop" *ngIf="isVisible" (click)="closeModal()"></div>
    <div class="modal-container" *ngIf="isVisible">
      <div class="modal-content">
        <button class="close-btn" (click)="closeModal()">✖</button>
        <img [src]="imageUrl" alt="Imagen" class="modal-image" />
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
    .modal-container {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      z-index: 1001;
    }
    .modal-content {
      text-align: center;
    }
    .modal-image {
      width: 400px;  /* Ancho fijo */
      height: auto;  /* Alto automático */
      border-radius: 5px;
    }
    .close-btn {
      position: absolute;
      top: 10px; right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
    }
  `],
})
export class ImageModalComponent {
  @Input() imageUrl: string = '';
  @Input() isVisible: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();

  closeModal() {
    this.closeModalEvent.emit();
  }
}
