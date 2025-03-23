/**
 * Checks if a string of HTML content contains text with red or blue color
 * @param {string} htmlContent - The HTML content to check
 * @returns {boolean} - True if the content has red or blue text
 */
export const hasRedOrBlueText = (htmlContent) => {
  if (typeof htmlContent !== 'string') return false;
  
  // Check for inline styles with red or blue (including variants)
  const hasColorStyle = /(color:\s*(red|blue|#[0-9a-f]{6}|#[0-9a-f]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)))/i.test(htmlContent);
  
  // Check for color class names
  const hasColorClass = /(class=["'][^"']*?(red|blue)[^"']*?["'])/i.test(htmlContent);
  
  // Check for font color attribute (although deprecated, still checking for compatibility)
  const hasFontColor = /(color=["'](red|blue|#[0-9a-f]{6}|#[0-9a-f]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))["'])/i.test(htmlContent);
  
  return hasColorStyle || hasColorClass || hasFontColor;
}; 