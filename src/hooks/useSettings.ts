import { useState, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS, PrimeContact } from '../types';

const STORAGE_KEY = 'myra_settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const addPrimeContact = useCallback((contact: PrimeContact) => {
    setSettingsState(prev => {
      const next = { ...prev, primeContacts: [...prev.primeContacts, contact] };
      saveSettings(next);
      return next;
    });
  }, []);

  const removePrimeContact = useCallback((index: number) => {
    setSettingsState(prev => {
      const next = {
        ...prev,
        primeContacts: prev.primeContacts.filter((_, i) => i !== index),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, addPrimeContact, removePrimeContact };
}
