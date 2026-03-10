import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DataService } from '../../services/data';
import { AuthService } from '../../services/auth';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ia';
  time: Date;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './ai-chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChat {
  private dataService = inject(DataService);
  private auth = inject(AuthService);

  messages = signal<ChatMessage[]>([
    {
      text: '¡Hola! Soy tu asistente de CoachPro. ¿En qué te puedo ayudar sobre tus rutinas, dietas o técnica?',
      sender: 'ia',
      time: new Date()
    }
  ]);

  newMessage = '';
  isTyping = signal(false);

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userText = this.newMessage.trim();
    this.messages.update(msgs => [...msgs, { text: userText, sender: 'user', time: new Date() }]);
    this.newMessage = '';
    this.isTyping.set(true);

    const userEmail = this.auth.currentUser()?.email;

    this.dataService.askCoachIA(userText, userEmail).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        this.messages.update(msgs => [...msgs, {
          text: res.response,
          sender: 'ia',
          time: new Date()
        }]);
        this.scrollToBottom();
      },
      error: (err) => {
        this.isTyping.set(false);
        this.messages.update(msgs => [...msgs, {
          text: 'Lo siento, no pude contactar con el Coach IA en este momento.',
          sender: 'ia',
          time: new Date()
        }]);
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.chat-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
