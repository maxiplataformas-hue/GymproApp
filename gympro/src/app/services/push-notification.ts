import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
    permissionStatus = signal<NotificationPermission>('default');

    constructor() {
        if ('Notification' in window) {
            this.permissionStatus.set(Notification.permission);
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) return false;

        const permission = await Notification.requestPermission();
        this.permissionStatus.set(permission);
        return permission === 'granted';
    }

    sendLocalNotification(title: string, body: string) {
        if (this.permissionStatus() === 'granted') {
            const options = {
                body: body,
                icon: '/icon-512.png',
                badge: '/icon-512.png',
                vibrate: [100, 50, 100]
            };

            // Try to show via service worker for better PWA support
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                new Notification(title, options);
            }
        }
    }
}
