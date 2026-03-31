import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AssistantMessage {
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: AssistantAction[];
}

export interface AssistantAction {
  type: 'navigate' | 'create' | 'filter' | 'help';
  label: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CyclonAssistantService {
  private baseUrl = environment.apiBaseUrl + '/assistant';
  private sessionId = this.generateSessionId();
  
  private messagesSubject = new BehaviorSubject<AssistantMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private isExpandedSubject = new BehaviorSubject<boolean>(false);
  public isExpanded$ = this.isExpandedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeSession();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeSession(): void {
    const welcomeMessage: AssistantMessage = {
      type: 'assistant',
      message: '¡Hola! Soy CYCLON 🌪️, tu asistente inteligente en Authoriza. Te ayudo con autenticación, usuarios, aplicaciones y contratos. ¿En qué puedo asistirte?',
      timestamp: new Date(),
      suggestions: ['Gestionar usuarios principales', 'Crear aplicaciones', 'Configurar paquetes', 'Ayuda con autenticación'],
      actions: [
        { type: 'help', label: 'Mostrar ayuda' }
      ]
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  private getWelcomeMessage(language: string): AssistantMessage {
    const isSpanish = language === 'es';
    return {
      type: 'assistant',
      message: isSpanish 
        ? '¡Hola! Soy CYCLON 🌪️, tu asistente inteligente en Authoriza. Te ayudo con autenticación, usuarios, aplicaciones y contratos. ¿En qué puedo asistirte?'
        : 'Hello! I\'m CYCLON 🌪️, your intelligent assistant in Authoriza. I help with authentication, users, applications, and contracts. How can I assist you?',
      timestamp: new Date(),
      suggestions: isSpanish 
        ? ['Gestionar usuarios principales', 'Crear aplicaciones', 'Configurar paquetes', 'Ayuda con autenticación']
        : ['Manage main users', 'Create applications', 'Configure packages', 'Authentication help'],
      actions: [
        { type: 'help', label: isSpanish ? 'Mostrar ayuda' : 'Show help' }
      ]
    };
  }

  setLanguage(language: string): void {
    const welcomeMessage = this.getWelcomeMessage(language);
    this.messagesSubject.next([welcomeMessage]);
  }

  async sendMessage(message: string, module: string, context?: any, language?: string): Promise<void> {
    const userMessage: AssistantMessage = {
      type: 'user',
      message,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    try {
      const response = await this.http.post<any>(`${this.baseUrl}/query`, {
        sessionId: this.sessionId,
        module,
        query: message,
        context,
        language: language || 'en'
      }).toPromise();

      const assistantMessage: AssistantMessage = {
        type: 'assistant',
        message: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actions: response.actions
      };

      const updatedMessages = this.messagesSubject.value;
      this.messagesSubject.next([...updatedMessages, assistantMessage]);
    } catch (error) {
      const isSpanish = language === 'es';
      const errorMessage: AssistantMessage = {
        type: 'assistant',
        message: isSpanish 
          ? 'Lo siento, hubo un error procesando tu consulta. ¿Puedes intentar de nuevo?'
          : 'Sorry, there was an error processing your query. Can you try again?',
        timestamp: new Date()
      };
      
      const updatedMessages = this.messagesSubject.value;
      this.messagesSubject.next([...updatedMessages, errorMessage]);
    }
  }

  toggleExpanded(): void {
    this.isExpandedSubject.next(!this.isExpandedSubject.value);
  }

  expand(): void {
    this.isExpandedSubject.next(true);
  }

  collapse(): void {
    this.isExpandedSubject.next(false);
  }

  clearChat(): void {
    this.initializeSession();
  }

  executeAction(action: AssistantAction): void {
    // Emit events for parent components to handle
    switch (action.type) {
      case 'navigate':
        // Handle navigation
        break;
      case 'create':
        // Handle creation
        break;
      case 'help':
        this.sendMessage('help', 'general');
        break;
    }
  }
}