'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PropertyItem } from '@/lib/property-types';

interface PropertyComparisonContextType {
  compareList: PropertyItem[];
  addToCompare: (property: PropertyItem) => boolean;
  removeFromCompare: (propertyId: string) => void;
  toggleCompare: (property: PropertyItem) => void;
  isInCompare: (propertyId: string) => boolean;
  clearCompare: () => void;
  setComparedProperties: (properties: PropertyItem[]) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const PropertyComparisonContext = createContext<PropertyComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'anv_compare_properties';
const MAX_COMPARE_LIMIT = 4;

export function PropertyComparisonProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<PropertyItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCompareList(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read comparison list from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
    } catch (e) {
      console.warn('Could not save comparison list to localStorage:', e);
    }
  }, [compareList, isInitialized]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const isInCompare = (propertyId: string) => {
    return compareList.some((p) => String(p.id) === String(propertyId));
  };

  const addToCompare = (property: PropertyItem): boolean => {
    if (isInCompare(property.id)) {
      showToast(`"${property.name}" is already in your comparison.`);
      return false;
    }
    if (compareList.length >= MAX_COMPARE_LIMIT) {
      showToast(`Maximum ${MAX_COMPARE_LIMIT} properties can be compared simultaneously.`);
      return false;
    }
    setCompareList((prev) => [...prev, property]);
    showToast(`Added "${property.name}" to comparison (${compareList.length + 1}/${MAX_COMPARE_LIMIT}).`);
    return true;
  };

  const removeFromCompare = (propertyId: string) => {
    setCompareList((prev) => {
      const removed = prev.find((p) => String(p.id) === String(propertyId));
      if (removed) {
        showToast(`Removed "${removed.name}" from comparison.`);
      }
      return prev.filter((p) => String(p.id) !== String(propertyId));
    });
  };

  const toggleCompare = (property: PropertyItem) => {
    if (isInCompare(property.id)) {
      removeFromCompare(property.id);
    } else {
      addToCompare(property);
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    showToast('Comparison list cleared.');
  };

  const setComparedProperties = (properties: PropertyItem[]) => {
    setCompareList(properties.slice(0, MAX_COMPARE_LIMIT));
  };

  return (
    <PropertyComparisonContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        isInCompare,
        clearCompare,
        setComparedProperties,
        toastMessage,
        showToast
      }}
    >
      {children}
    </PropertyComparisonContext.Provider>
  );
}

export function usePropertyComparison() {
  const context = useContext(PropertyComparisonContext);
  if (!context) {
    throw new Error('usePropertyComparison must be used within a PropertyComparisonProvider');
  }
  return context;
}
