import { Injectable, signal } from '@angular/core';

const CRED_ID_KEY = 'gympro-biometric-id';
const CRED_EMAIL_KEY = 'gympro-biometric-email';

@Injectable({ providedIn: 'root' })
export class BiometricService {
    isAvailable = signal(false);
    hasSavedCredential = signal(false);

    constructor() {
        this.init();
    }

    private async init() {
        if (!window.PublicKeyCredential) return;
        try {
            const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            this.isAvailable.set(ok);
            this.hasSavedCredential.set(!!localStorage.getItem(CRED_ID_KEY));
        } catch {
            // not supported
        }
    }

    savedEmail(): string | null {
        return localStorage.getItem(CRED_EMAIL_KEY);
    }

    async register(email: string): Promise<boolean> {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const userId = crypto.getRandomValues(new Uint8Array(16));

            const cred = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: 'CoachPro', id: window.location.hostname },
                    user: { id: userId, name: email, displayName: email },
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },
                        { alg: -257, type: 'public-key' }
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required',
                        residentKey: 'discouraged'
                    },
                    timeout: 60000
                }
            }) as PublicKeyCredential | null;

            if (!cred) return false;

            const raw = new Uint8Array(cred.rawId);
            const b64 = btoa(String.fromCharCode(...raw));
            localStorage.setItem(CRED_ID_KEY, b64);
            localStorage.setItem(CRED_EMAIL_KEY, email);
            this.hasSavedCredential.set(true);
            return true;
        } catch (e) {
            console.warn('Biometric register error:', e);
            return false;
        }
    }

    async authenticate(): Promise<string | null> {
        try {
            const b64 = localStorage.getItem(CRED_ID_KEY);
            const email = localStorage.getItem(CRED_EMAIL_KEY);
            if (!b64 || !email) return null;

            const binary = atob(b64);
            const credId = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) credId[i] = binary.charCodeAt(i);

            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    allowCredentials: [{ id: credId.buffer, type: 'public-key' }],
                    userVerification: 'required',
                    timeout: 60000
                }
            });
            return assertion ? email : null;
        } catch (e) {
            console.warn('Biometric auth error:', e);
            return null;
        }
    }

    clearCredential() {
        localStorage.removeItem(CRED_ID_KEY);
        localStorage.removeItem(CRED_EMAIL_KEY);
        this.hasSavedCredential.set(false);
    }
}
