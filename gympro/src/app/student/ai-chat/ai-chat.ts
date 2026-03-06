import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

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
  messages = signal<ChatMessage[]>([
    {
      text: '¡Hola! Soy tu asistente de GymPro. ¿En qué te puedo ayudar sobre tus rutinas, dietas o técnica?',
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

    // Mock IA response after 1.5s
    setTimeout(() => {
      this.isTyping.set(false);

      let reply = 'Interesante. Asegúrate de siempre mantener una buena hidratación.';
      const lower = userText.toLowerCase();

      if (lower.includes('pecho') || lower.includes('banca')) {
        reply = 'Para ejercicios de pecho como el Press de Banca, recuerda retraer las escápulas y mantener los pies firmes en el suelo para mayor estabilidad.';
      } else if (lower.includes('dieta') || lower.includes('comida')) {
        reply = 'Recuerda que para ganar masa muscular debes estar en superávit calórico y consumir al menos 1.8g de proteína por kg de peso corporal.';
      } else if (lower.includes('dolor')) {
        reply = 'Si experimentas dolor agudo durante un ejercicio, detente inmediatamente. Podría ser recomendable consultar a tu coach o un fisioterapeuta.';
      }

      this.messages.update(msgs => [...msgs, { text: reply, sender: 'ia', time: new Date() }]);
    }, 1500);
  }
}
