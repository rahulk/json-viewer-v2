// File utilities for JSON Viewer

/**
 * Extracts section code from a filename
 * @param {string} filename - The filename to extract from
 * @returns {string|null} - The extracted section code or null
 */
export const extractSectionCode = (filename) => {
  if (!filename) return null;
  const match = filename.match(/_((?:ENR|AD|GEN|AMDT)_\d+(?:_\d+)?)/i);
  return match ? match[1] : null;
}; 