import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CyclonAssistantService, AssistantMessage, AssistantAction } from '../../services/cyclon-assistant/cyclon-assistant.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cyclon-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cyclon-assistant.component.html',
  styleUrls: ['./cyclon-assistant.component.css']
})
export class CyclonAssistantComponent implements OnInit, OnDestroy, OnChanges {
  @Input() currentModule: string = 'general';
  @Input() moduleContext: any = {};
  @Input() language: string = 'en';

  messages: AssistantMessage[] = [];
  isExpanded = false;
  currentMessage = '';
  isTyping = false;

  private destroy$ = new Subject<void>();

  constructor(private cyclonService: CyclonAssistantService) {}

  ngOnInit(): void {
    this.cyclonService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
      });

    this.cyclonService.isExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expanded => {
        this.isExpanded = expanded;
      });

    // Configurar idioma inicial
    this.cyclonService.setLanguage(this.language);
  }

  ngOnChanges(): void {
    // Actualizar idioma cuando cambie
    if (this.cyclonService) {
      this.cyclonService.setLanguage(this.language);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    this.cyclonService.toggleExpanded();
  }

  async sendMessage(): Promise<void> {
    if (!this.currentMessage.trim()) return;

    const message = this.currentMessage;
    this.currentMessage = '';
    this.isTyping = true;

    await this.cyclonService.sendMessage(message, this.currentModule, this.moduleContext, this.language);
    this.isTyping = false;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  executeSuggestion(suggestion: string): void {
    this.currentMessage = suggestion;
    this.sendMessage();
  }

  executeAction(action: AssistantAction): void {
    this.cyclonService.executeAction(action);
  }

  clearChat(): void {
    this.cyclonService.clearChat();
  }
}