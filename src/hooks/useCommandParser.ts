import { useCallback } from 'react';
import { AppCommand, PrimeContact } from '../types';

const APP_PACKAGES: Record<string, string> = {
  youtube: 'https://youtube.com',
  whatsapp: 'https://web.whatsapp.com',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  chrome: 'https://google.com',
  google: 'https://google.com',
  gmail: 'https://mail.google.com',
  maps: 'https://maps.google.com',
  spotify: 'https://spotify.com',
  netflix: 'https://netflix.com',
  twitter: 'https://x.com',
  x: 'https://x.com',
  telegram: 'https://web.telegram.org',
  snapchat: 'https://snapchat.com',
  calendar: 'https://calendar.google.com',
  'play store': 'https://play.google.com',
  amazon: 'https://amazon.com',
  flipkart: 'https://flipkart.com',
  paytm: 'https://paytm.com',
  phonepe: 'https://phonepe.com',
  gpay: 'https://pay.google.com',
  zoom: 'https://zoom.us',
  meet: 'https://meet.google.com',
  teams: 'https://teams.microsoft.com',
  discord: 'https://discord.com',
  linkedin: 'https://linkedin.com',
};

const APP_ALIASES: Record<string, string> = {
  yt: 'youtube',
  'you tube': 'youtube',
  "what'sapp": 'whatsapp',
  'whats app': 'whatsapp',
  insta: 'instagram',
  fb: 'facebook',
  map: 'maps',
  googlemap: 'maps',
  'google maps': 'maps',
  mail: 'gmail',
  music: 'spotify',
};

function normalizeText(input: string) {
  let cleaned = input.toLowerCase().replace(/[।,.!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  // Strip wake words from the start of the command text so "myra open youtube" parses cleanly as "open youtube"
  cleaned = cleaned.replace(/^(hey myra|hi myra|ok myra|okay myra|myra|maya|mira|मायरा|हे मायरा|please)\s+/i, '').trim();
  return cleaned;
}

function normalizeAppName(app: string) {
  const cleaned = normalizeText(app)
    .replace(/\b(karo|kar do|karna|please|app|application|ko|the|a)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return APP_ALIASES[cleaned] || cleaned;
}

function findAppName(text: string) {
  const candidates = Object.keys(APP_PACKAGES).concat(Object.keys(APP_ALIASES));
  for (const candidate of candidates.sort((a, b) => b.length - a.length)) {
    if (text.includes(candidate)) return APP_ALIASES[candidate] || candidate;
  }
  return '';
}

export function useCommandParser(primeContacts: PrimeContact[]) {
  const parse = useCallback((text: string): AppCommand | null => {
    const t = normalizeText(text);

    if (/\b(open|kholo|khol|launch|start|chalu)\b/.test(t)) {
      const appFromText = findAppName(t);
      if (appFromText) return { type: 'OPEN_APP', params: { app_name: appFromText, url: APP_PACKAGES[appFromText] || '' } };
      const match = t.match(/(?:open|kholo|khol|launch|start|chalu)\s+(.+)/i) || t.match(/(.+?)\s+(?:open|kholo|khol|launch|start|chalu)/i);
      if (match?.[1]) {
        const appName = normalizeAppName(match[1]);
        if (appName) return { type: 'OPEN_APP', params: { app_name: appName, url: APP_PACKAGES[appName] || '' } };
      }
    }

    if (/\b(close|band|bandh|exit)\b/.test(t)) {
      const appName = findAppName(t) || normalizeAppName(t.replace(/\b(close|band|bandh|exit)\b/g, ''));
      if (appName) return { type: 'CLOSE_APP', params: { app_name: appName } };
    }

    if (/(close friend|prime|mera close friend|mere close friend|meri jaan|my love|my close friend|favorite|favourite)/i.test(t)) {
      const isMsg = /(?:message|msg|sms|text|send|bhejo|bhej)/i.test(t);
      let idx = 0;
      if (/(?:second|doosra|2nd|dusra)/i.test(t)) idx = 1;
      if (/(?:third|teesra|3rd)/i.test(t)) idx = 2;
      if (primeContacts[idx]) {
        return { type: isMsg ? 'PRIME_MSG' : 'PRIME_CALL', params: { name: primeContacts[idx].name, number: primeContacts[idx].number, index: String(idx) } };
      }
      return { type: isMsg ? 'PRIME_MSG' : 'PRIME_CALL', params: { missing: 'true', index: String(idx) } };
    }

    const callHinglish = t.match(/(.+?)\s+(?:ko\s+)?(?:call|phone|dial)\s*(?:karo|kar do|karna)?$/i);
    const callEnglish = t.match(/(?:call|phone|dial)\s+(.+)$/i);
    if (callHinglish || callEnglish) {
      const name = normalizeText((callEnglish?.[1] || callHinglish?.[1] || '').replace(/\b(karo|kar do|please)\b/g, ''));
      if (name) return { type: 'CALL', params: { name } };
    }

    if (/\b(sms|message|msg|text|whatsapp)\b/.test(t)) {
      const isWhatsApp = /whatsapp/.test(t);
      const isCall = /call/.test(t);
      const nameMatch = t.match(/(?:to|ko)\s+([a-zA-Z\s]+)/i) || t.match(/(?:sms|message|msg|text|whatsapp)\s+(.+?)(?:\s+ko|$)/i);
      const name = normalizeText(nameMatch?.[1] || '').replace(/\b(karo|bhejo|send|call)\b/g, '').trim();
      if (isWhatsApp) return { type: isCall ? 'WHATSAPP_CALL' : 'WHATSAPP_MSG', params: { name } };
      return { type: 'SMS', params: { name, message: '' } };
    }

    if (/(?:volume|awaz|awaaz)\s*(?:badhao|up|increase|badao|tez)/i.test(t)) return { type: 'VOLUME_UP', params: {} };
    if (/(?:volume|awaz|awaaz)\s*(?:kam|down|decrease|ghatao|slow)/i.test(t)) return { type: 'VOLUME_DOWN', params: {} };
    if (/(?:torch|flashlight|flash)\s*(?:on|chalu|karo|jala)/i.test(t)) return { type: 'FLASHLIGHT_ON', params: {} };
    if (/(?:torch|flashlight|flash)\s*(?:off|band|bujha)/i.test(t)) return { type: 'FLASHLIGHT_OFF', params: {} };
    if (/(?:wifi|wi-fi)\s*(?:on|chalu|enable)/i.test(t)) return { type: 'WIFI_ON', params: {} };
    if (/(?:wifi|wi-fi)\s*(?:off|band|disable)/i.test(t)) return { type: 'WIFI_OFF', params: {} };
    if (/(?:bluetooth|bt)\s*(?:on|chalu|enable)/i.test(t)) return { type: 'BLUETOOTH_ON', params: {} };
    if (/(?:bluetooth|bt)\s*(?:off|band|disable)/i.test(t)) return { type: 'BLUETOOTH_OFF', params: {} };

    return null;
  }, [primeContacts]);

  const executeCommand = useCallback((command: AppCommand): string => {
    switch (command.type) {
      case 'OPEN_APP': {
        const url = command.params.url;
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return `${command.params.app_name} khol diya.`;
        }
        return `${command.params.app_name} command samajh gayi, lekin web app se isko direct open nahi kar sakti.`;
      }
      case 'CLOSE_APP':
        return `${command.params.app_name} close command received. Web browser mein current tab ko direct close nahi kar sakti.`;
      case 'PRIME_CALL':
        if (command.params.missing) return 'Prime contact set nahi hai. Settings mein prime contact add karo.';
        window.location.href = `tel:${command.params.number}`;
        return `${command.params.name} ko call kar rahi hoon.`;
      case 'PRIME_MSG':
        if (command.params.missing) return 'Prime contact set nahi hai. Settings mein prime contact add karo.';
        window.location.href = `sms:${command.params.number}`;
        return `${command.params.name} ko message open kar rahi hoon.`;
      case 'CALL':
        return `${command.params.name} ko call karne ke liye phone number/contact access chahiye. Web version mein contact lookup available nahi hai.`;
      case 'SMS':
        return `${command.params.name || 'contact'} ko SMS bhejne ke liye native SMS access chahiye. Web version mein limited support hai.`;
      case 'WHATSAPP_CALL':
        window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
        return 'WhatsApp open kar diya. Call manually start kar sakte ho.';
      case 'WHATSAPP_MSG':
        window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
        return 'WhatsApp open kar diya. Message type kar sakte ho.';
      case 'VOLUME_UP':
        return 'Volume up command noted. Browser security ke wajah se system volume direct control nahi kar sakti.';
      case 'VOLUME_DOWN':
        return 'Volume down command noted. Browser security ke wajah se system volume direct control nahi kar sakti.';
      case 'FLASHLIGHT_ON':
        return 'Torch on command noted. Web app se flashlight direct control limited hai.';
      case 'FLASHLIGHT_OFF':
        return 'Torch off command noted.';
      case 'WIFI_ON':
        return 'WiFi on command noted. Browser se WiFi direct control nahi hota.';
      case 'WIFI_OFF':
        return 'WiFi off command noted. Browser se WiFi direct control nahi hota.';
      case 'BLUETOOTH_ON':
        return 'Bluetooth on command noted. Browser security ke wajah se limited support hai.';
      case 'BLUETOOTH_OFF':
        return 'Bluetooth off command noted.';
      default:
        return 'Command execute ho gayi.';
    }
  }, []);

  return { parse, executeCommand };
}