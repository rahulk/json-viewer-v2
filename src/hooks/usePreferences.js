import { useCallback } from 'react';
import { showNotification } from '../utils/uiUtils';

/**
 * Custom hook for managing display preferences
 * @param {string} pdfFilename - The current PDF filename
 * @returns {Object} - Methods for saving and loading preferences
 */
export const usePreferences = (pdfFilename) => {
  /**
   * Saves display preferences to the server
   * @param {string} tabType - The type of tab (parsed or enhanced)
   * @param {React.RefObject} ref - Reference to the component with column data
   * @param {string} sectionCode - The section code
   */
  const saveDisplayPreferences = useCallback(async (tabType, ref, sectionCode) => {
    if (!pdfFilename || !sectionCode) {
      showNotification('❌ Cannot save preferences: Missing PDF filename or section code', true);
      return;
    }

    try {
      const selectedColumns = ref.current?.getSelectedColumns();
      const columnWidths = ref.current?.getColumnWidths();
      const columnOrder = ref.current?.getColumnOrder();

      if (!selectedColumns || !columnWidths) {
        showNotification('❌ Cannot save preferences: Missing table state', true);
        return;
      }

      const response = await fetch('http://localhost:3001/api/save-display-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfFilename,
          sectionCode,
          tabType,
          selectedColumns,
          columnWidths,
          columnOrder
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save display preferences');
      }

      await response.json();

      // Create success message with file details
      const baseFilename = pdfFilename.replace(/\.pdf$/, '');
      const prefsFilename = `${baseFilename}_${sectionCode}_${tabType}.json`;
      
      // Log detailed info about what was saved
      console.log(`📝 Saved ${tabType} preferences for ${sectionCode}:`, {
        filename: prefsFilename,
        columns: Object.keys(selectedColumns).length,
        widths: Object.keys(columnWidths).length,
        orderLength: (columnOrder || []).length
      });
      
      const successMessage = `
        <div style="margin-bottom: 5px;"><strong>✅ Display settings saved successfully!</strong></div>
        <div style="font-size: 0.9em;">File: ${prefsFilename}</div>
        <div style="font-size: 0.9em;">Location: preferences/${prefsFilename}</div>
      `;

      showNotification(successMessage);
      console.log(`✅ Display preferences saved for ${tabType}`);
    } catch (error) {
      showNotification('❌ Failed to save display preferences', true);
      console.error('Error saving display preferences:', error);
    }
  }, [pdfFilename]);
  
  /**
   * Loads display preferences from the server
   * @param {string} tabType - The type of tab (parsed or enhanced)
   * @param {string} sectionCode - The section code
   * @returns {Object|null} - The loaded preferences or null
   */
  const loadDisplayPreferences = useCallback(async (tabType, sectionCode) => {
    if (!pdfFilename || !sectionCode) {
      console.log(`⚠️ Cannot load ${tabType} preferences: Missing PDF filename or section code`);
      return null;
    }

    try {
      const params = new URLSearchParams({
        pdfFilename,
        sectionCode,
        tabType
      });

      const response = await fetch(`http://localhost:3001/api/display-preferences?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${tabType} preferences`);
      }

      const preferences = await response.json();
      console.log(`📥 Loaded ${tabType} preferences for ${sectionCode}:`, {
        columns: Object.keys(preferences.selectedColumns || {}).length,
        widths: Object.keys(preferences.columnWidths || {}).length,
        orderLength: (preferences.columnOrder || []).length
      });
      return preferences;
    } catch (error) {
      console.error(`❌ Error loading ${tabType} preferences:`, error);
      return null;
    }
  }, [pdfFilename]);

  return {
    saveDisplayPreferences,
    loadDisplayPreferences
  };
};