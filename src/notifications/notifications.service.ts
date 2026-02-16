import { Injectable } from '@nestjs/common';

export interface SendLinkOptions {
  phone: string;
  link: string;
  message?: string;
}

export interface SendMessageOptions {
  phone: string;
  message: string;
}

/**
 * Servicio de notificaciones. En desarrollo usa mock (console).
 * En producción inyectar implementación con WhatsApp Business API y SMS (ej. Twilio).
 */
@Injectable()
export class NotificationsService {
  async sendRecoveryLink(options: SendLinkOptions): Promise<void> {
    const { phone, link, message } = options;
    const text = message ?? `Recuperación de cuenta. Accede al enlace: ${link}`;
    await this.sendSms({ phone, message: text });
    await this.sendWhatsApp({ phone, message: text });
  }

  async sendSms(options: SendMessageOptions): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[NotificationsService] SMS mock:', {
        to: options.phone,
        message: options.message,
      });
    }
  }

  async sendWhatsApp(options: SendMessageOptions): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[NotificationsService] WhatsApp mock:', {
        to: options.phone,
        message: options.message,
      });
    }
  }

  async notifyAdminsNewRegistration(data: {
    adminPhones: string[];
    residentPhone: string;
    street: string;
    number: string;
    letter?: string | null;
  }): Promise<void> {
    const message = `Nueva solicitud de registro: ${data.street} ${data.number}${data.letter ? ` ${data.letter}` : ''}. Teléfono: ${data.residentPhone}. Revisar en el panel.`;
    for (const phone of data.adminPhones) {
      await this.sendSms({ phone, message });
      await this.sendWhatsApp({ phone, message });
    }
  }

  async notifyAdminsRecoveryRequest(data: {
    adminPhones: string[];
    userPhone: string;
    newPhone: string;
  }): Promise<void> {
    const message = `Solicitud de recuperación de cuenta. Usuario: ${data.userPhone}. Nuevo teléfono: ${data.newPhone}.`;
    for (const phone of data.adminPhones) {
      await this.sendSms({ phone, message });
      await this.sendWhatsApp({ phone, message });
    }
  }
}
