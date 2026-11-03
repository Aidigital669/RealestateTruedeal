'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClientSession, setClientSession, UserProfile } from '@/lib/user-auth';

interface SavedPropertiesContextType {
  savedIds: string[];
  savedCount: number;
  safeSavedIds: string[];
  isSaved: (propertyId: string | number) => boolean;
  isSafeSaved: (propertyId: string | number) => boolean;
  toggleSave: (propertyId: string | number, propertyName?: string) => boolean;
  toggleSafeSaved: (propertyId: string | number) => boolean;
  addToSaved: (propertyId: string | number) => void;
  removeFromSaved: (propertyId: string | number) => void;
  clearSaved: () => void;
  clearSavedExcept: (keepIds: (string | number)[]) => void;
  currentUser: UserProfile | null;
  switchPatronProfile: (user: UserProfile | null) => void;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'anv_saved_properties_guest';
const LEGACY_STORAGE_KEY = 'anv_saved_properties';
const SAFE_STORAGE_KEY = 'anv_safe_properties_list';

function getStorageKeyForUser(user: UserProfile | null): string {
  if (user && (user.id || user.email)) {
    const safeKey = (user.id || user.email).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `anv_saved_properties_${safeKey}`;
  }
  return GUEST_STORAGE_KEY;
}

export function SavedPropertiesProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [safeSavedIds, setSafeSavedIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Load saved properties per logged-in human user
  const loadSaved = () => {
    if (typeof window === 'undefined') return;
    try {
      const user = getClientSession();
      setCurrentUser(user);

      const storageKey = getStorageKeyForUser(user);
      const storedRaw = localStorage.getItem(storageKey);

      if (storedRaw !== null) {
        const parsed: string[] = JSON.parse(storedRaw);
        setSavedIds(parsed);
      } else if (user && user.savedPropertyIds && Array.isArray(user.savedPropertyIds)) {
        setSavedIds(user.savedPropertyIds);
        localStorage.setItem(storageKey, JSON.stringify(user.savedPropertyIds));
      } else if (!user) {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw);
          setSavedIds(parsed);
          localStorage.setItem(GUEST_STORAGE_KEY, legacyRaw);
        } else {
          setSavedIds([]);
        }
      } else {
        setSavedIds([]);
      }

      // Load safe protected IDs
      const safeRaw = localStorage.getItem(SAFE_STORAGE_KEY);
      if (safeRaw) {
        try {
          const parsedSafe = JSON.parse(safeRaw);
          if (Array.isArray(parsedSafe)) {
            setSafeSavedIds(parsedSafe.map(String));
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Error loading saved properties:', e);
    }
  };

  useEffect(() => {
    loadSaved();

    const handleSavedChange = () => loadSaved();
    const handleAuthChange = () => loadSaved();

    window.addEventListener('anv_saved_change', handleSavedChange);
    window.addEventListener('anv_auth_change', handleAuthChange);
    window.addEventListener('storage', handleSavedChange);

    return () => {
      window.removeEventListener('anv_saved_change', handleSavedChange);
      window.removeEventListener('anv_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleSavedChange);
    };
  }, []);

  const persist = (newList: string[]) => {
    setSavedIds(newList);
    if (typeof window !== 'undefined') {
      try {
        const user = getClientSession();
        const storageKey = getStorageKeyForUser(user);
        localStorage.setItem(storageKey, JSON.stringify(newList));
        
        if (user) {
          const updatedUser: UserProfile = {
            ...user,
            savedPropertyIds: newList
          };
          setClientSession(updatedUser);
        } else {
          localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(newList));
        }

        window.dispatchEvent(new Event('anv_saved_change'));
      } catch (e) {
        console.warn('Error saving to storage:', e);
      }
    }
  };

  const persistSafe = (newSafeList: string[]) => {
    setSafeSavedIds(newSafeList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SAFE_STORAGE_KEY, JSON.stringify(newSafeList));
      } catch (e) {
        console.warn('Error saving safe properties:', e);
      }
    }
  };

  const isSaved = (propertyId: string | number): boolean => {
    return savedIds.includes(String(propertyId));
  };

  const isSafeSaved = (propertyId: string | number): boolean => {
    return safeSavedIds.includes(String(propertyId));
  };

  const toggleSafeSaved = (propertyId: string | number): boolean => {
    const idStr = String(propertyId);
    let next: string[];
    let wasSafe = false;
    if (safeSavedIds.includes(idStr)) {
      next = safeSavedIds.filter((id) => id !== idStr);
      wasSafe = false;
    } else {
      next = [...safeSavedIds, idStr];
      wasSafe = true;
    }
    persistSafe(next);
    return wasSafe;
  };

  const toggleSave = (propertyId: string | number, propertyName?: string): boolean => {
    const idStr = String(propertyId);
    let next: string[];
    let wasSaved = false;

    if (savedIds.includes(idStr)) {
      next = savedIds.filter((id) => id !== idStr);
      wasSaved = false;
    } else {
      next = [...savedIds, idStr];
      wasSaved = true;
    }

    persist(next);
    return wasSaved;
  };

  const addToSaved = (propertyId: string | number) => {
    const idStr = String(propertyId);
    if (!savedIds.includes(idStr)) {
      persist([...savedIds, idStr]);
    }
  };

  const removeFromSaved = (propertyId: string | number) => {
    const idStr = String(propertyId);
    persist(savedIds.filter((id) => id !== idStr));
  };

  const clearSaved = () => {
    persist([]);
  };

  const clearSavedExcept = (keepIds: (string | number)[]) => {
    const keepSet = new Set(keepIds.map((id) => String(id)));
    const remaining = savedIds.filter((id) => keepSet.has(String(id)));
    persist(remaining);
  };

  const switchPatronProfile = (user: UserProfile | null) => {
    if (user) {
      setClientSession(user);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('anv_client_session');
        window.dispatchEvent(new Event('anv_auth_change'));
      }
    }
    setTimeout(() => loadSaved(), 50);
  };

  return (
    <SavedPropertiesContext.Provider
      value={{
        savedIds,
        savedCount: savedIds.length,
        safeSavedIds,
        isSaved,
        isSafeSaved,
        toggleSave,
        toggleSafeSaved,
        addToSaved,
        removeFromSaved,
        clearSaved,
        clearSavedExcept,
        currentUser,
        switchPatronProfile
      }}
    >
      {children}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties() {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
}
