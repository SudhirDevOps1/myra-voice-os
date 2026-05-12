import { useCallback } from 'react';
import { AppCommand, PrimeContact } from '../types';

const APP_PACKAGES: Record<string, string> = {
  youtube: 'https://youtube.com',
  whatsapp: 'https://web.whatsapp.com',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  chrome: 'https://google.com',
  gmail: 'https://mail.google.com',
  maps: 'https://maps.google.com',
  spotify: 'https://spotify.com',
  netflix: 'https://netflix.com',
  twitter: 'https://x.com',
  x: 'https://x.com',
  telegram: 'https://web.telegram.org',
  snapchat: 'https://snapchat.com',
  settings: '',
  calculator: '',
  calendar: 'https://calendar.google.com',
  clock: '',
  'play store': 'https://play.google.com',
  amazon: 'https://amazon.com',
  flipkart: 'https://flipkart.com',
  paytm: 'https://paytm.com',
  phonepe: 'https://phonepe.com',
  gpay: 'https://pay.google.com',
  zoom: 'https://zoom.us',
  meet: 'https://meet.google.com',
  teams: 'https://teams.microsoft.com',
  tiktok: 'https://tiktok.com',
  discord: 'https://discord.com',
  linkedin: 'https://linkedin.com',
};

export function useCommandParser(primeContacts: PrimeContact[]) {
  const parse = useCallback(
    (text: string): AppCommand | null => {
      const t = text.toLowerCase().trim();

      // Open app
      const openMatch = t.match(/(?:open|kholo|launch|start)\s+(.+?)(?:\s|$)/i);
      const openSimple = t.match(/^(.+?)\s+(?:kholo|open|khol|open karo)/i);
      if (openMatch || openSimple) {
        const appName = (openMatch?.[1] || openSimple?.[1] || '').toLowerCase().trim();
        if (APP_PACKAGES[appName]) {
          return { type: 'OPEN_APP', params: { app_name: appName, url: APP_PACKAGES[appName] } };
        }
        // Check all keys
        for (const [key, url] of Object.entries(APP_PACKAGES)) {
          if (appName.includes(key) || key.includes(appName)) {
            return { type: 'OPEN_APP', params: { app_name: key, url } };
          }
        }
      }

      // Close app
      if (/(?:close|band karo|band)\s+(.+)/i.test(t)) {
        const m = t.match(/(?:close|band karo|band)\s+(.+)/i);
        return { type: 'CLOSE_APP', params: { app_name: (m?.[1] || '').trim() } };
      }

      // Prime contact call
      if (/(?:close friend|prime|mera close friend|mere close friend|meri jaan|my love|my close friend)/i.test(t)) {
        const isMsg = /(?:message|msg|sms|text|send)/i.test(t);
        let idx = 0;
        if (/(?:second|doosra|2nd|dusra)/i.test(t)) idx = 1;
        if (/(?:third|teesra|3rd)/i.test(t)) idx = 2;
        if (primeContacts[idx]) {
          if (isMsg) {
            return { type: 'PRIME_MSG', params: { name: primeContacts[idx].name, number: primeContacts[idx].number } };
          }
          return { type: 'PRIME_CALL', params: { name: primeContacts[idx].name, number: primeContacts[idx].number } };
        }
      }

      // Call someone
      const callMatch = t.match(/(?:call|phone|dial)\s+(.+?)(?:\s|ko|$)/i);
      const callHinglish = t.match(/(.+?)\s+(?:ko call|ko phone|ko dial)\s*(?:karo|karein|kar)/i);
      if (callMatch || callHinglish) {
        const name = (callMatch?.[1] || callHinglish?.[1] || '').trim();
        return { type: 'CALL', params: { name } };
      }

      // SMS / message
      const smsMatch = t.match(/(?:sms|message|msg|text)\s+(?:bhejo|karo|send|to)\s+(.+?)(?:\s|ko|$)/i);
      if (smsMatch) {
        return { type: 'SMS', params: { name: smsMatch[1].trim(), message: '' } };
      }

      // Volume
      if (/(?:volume|awaz)\s*(?:badhao|up|increase|badao)/i.test(t)) return { type: 'VOLUME_UP', params: {} };
      if (/(?:volume|awaz)\s*(?:kam|down|decrease|ghatao)/i.test(t)) return { type: 'VOLUME_DOWN', params: {} };

      // WhatsApp
      if (/whatsapp\s+(?:karo|msg|message|call)\s+(.+)/i.test(t)) {
        const m = t.match(/whatsapp\s+(?:karo|msg|message|call)\s+(.+)/i);
        const isCall = /call/i.test(t);
        return { type: isCall ? 'WHATSAPP_CALL' : 'WHATSAPP_MSG', params: { name: (m?.[1] || '').trim() } };
      }

      // Flashlight
      if (/(?:torch|flashlight|flash)\s*(?:on|chalu|karo)/i.test(t)) return { type: 'FLASHLIGHT_ON', params: {} };
      if (/(?:torch|flashlight|flash)\s*(?:off|band|karo)/i.test(t)) return { type: 'FLASHLIGHT_OFF', params: {} };

      // WiFi
      if (/(?:wifi|wi-fi)\s*(?:on|chalu|enable)/i.test(t)) return { type: 'WIFI_ON', params: {} };
      if (/(?:wifi|wi-fi)\s*(?:off|band|disable)/i.test(t)) return { type: 'WIFI_OFF', params: {} };

      // Bluetooth
      if (/(?:bluetooth|bt)\s*(?:on|chalu|enable)/i.test(t)) return { type: 'BLUETOOTH_ON', params: {} };
      if (/(?:bluetooth|bt)\s*(?:off|band|disable)/i.test(t)) return { type: 'BLUETOOTH_OFF', params: {} };

      return null;
    },
    [primeContacts]
  );

  const executeCommand = useCallback((command: AppCommand): string => {
    switch (command.type) {
      case 'OPEN_APP': {
        const url = command.params.url;
        if (url) {
          window.open(url, '_blank');
          return `${command.params.app_name} khol diya! ✅`;
        }
        return `Sorry, ${command.params.app_name} ko web mein open nahi kar sakti.`;
      }
      case 'CLOSE_APP':
        return `${command.params.app_name} band kar diya (web mein window close nahi ho sakta).`;
      case 'PRIME_CALL':
        return `${command.params.name} ko call initiate kar rahi hoon — 📞 ${command.params.number}`;
      case 'PRIME_MSG':
        return `${command.params.name} ko message bhej rahi hoon — ✉️ ${command.params.number}`;
      case 'CALL':
        return `${command.params.name} ko call kar rahi hoon. Web mein calling directly possible nahi hai, par maine dial kar diya!`;
      case 'SMS':
        return `${command.params.name} ko SMS bhej rahi hoon.`;
      case 'WHATSAPP_CALL':
        window.open(`https://wa.me/?text=Hi`, '_blank');
        return `WhatsApp call initiate kar di!`;
      case 'WHATSAPP_MSG':
        window.open(`https://wa.me/?text=Hi`, '_blank');
        return `WhatsApp message bhej diya!`;
      case 'VOLUME_UP':
        return 'Volume badha diya 🔊';
      case 'VOLUME_DOWN':
        return 'Volume kam kar diya 🔉';
      case 'FLASHLIGHT_ON':
        return 'Torch ON! Web mein torch support nahi hai, but noted! 🔦';
      case 'FLASHLIGHT_OFF':
        return 'Torch OFF! 🔦';
      case 'WIFI_ON':
        return 'WiFi ON kar diya (simulated)';
      case 'WIFI_OFF':
        return 'WiFi OFF kar diya (simulated)';
      default:
        return 'Command execute ho gayi! ✅';
    }
  }, []);

  return { parse, executeCommand };
}
