/**
 * Service for handling API requests to the backend
 */
const API_BASE_URL = 'http://localhost:3001/api';

export const apiService = {
  /**
   * Fetch folders from a specific directory path
   * @param {string} directoryPath - The directory path to fetch folders from
   * @returns {Promise<Array<string>>} - Array of folder names
   */
  async getFolders(directoryPath = '/documents/output') {
    try {
      const encodedPath = encodeURIComponent(directoryPath);
      const response = await fetch(`${API_BASE_URL}/folders?path=${encodedPath}`);
      if (!response.ok) throw new Error(`Failed to fetch folders: ${response.statusText}`);
      const data = await response.json();
      return data.folders || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  },

  /**
   * Get files from a specific folder path
   * @param {string} folderPath - The folder path to fetch files from
   * @returns {Promise<Array<string>>} - Array of file names
   */
  async getFiles(folderPath) {
    try {
      const encodedPath = encodeURIComponent(folderPath);
      const response = await fetch(`${API_BASE_URL}/files?path=${encodedPath}`);
      if (!response.ok) throw new Error(`Failed to fetch files: ${response.statusText}`);
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }
};