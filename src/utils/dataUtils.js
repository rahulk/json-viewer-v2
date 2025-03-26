export const flattenNestedData = (data) => {
  // A Set to track field names (for column ordering)
  const fieldSet = new Set();

  /**
   * Recursively flatten any JSON value.
   * @param {*} item - The current JSON item (object, array, or primitive).
   * @param {Object} context - The accumulated parent key/value pairs.
   * @param {String} prefix - The prefix to use for the current key.
   * @returns {Array<Object>} An array of flattened rows.
   */
  function flattenRecursive(item, context = {}, prefix = '') {
    if (Array.isArray(item)) {
      // For an array, flatten each element and concatenate results.
      let result = [];
      // If the array is empty, we don’t generate any row for it.
      if (item.length === 0) {
        return result;
      }
      for (const element of item) {
        // Each element uses the same context and key prefix.
        const subRows = flattenRecursive(element, { ...context }, prefix);
        result = result.concat(subRows);
      }
      return result;
    } else if (item !== null && typeof item === 'object') {
      // For objects, process each key-value pair.
      const keys = Object.keys(item);
      // If an object is empty, simply return the current context.
      if (keys.length === 0) {
        return [ { ...context } ];
      }
      // Start with a single row equal to the current context.
      let currentRows = [ { ...context } ];
      for (const [key, value] of Object.entries(item)) {
        // Build the new key – if a prefix exists, join with a dot.
        const newKey = prefix ? `${prefix}.${key}` : key;
        fieldSet.add(newKey);
        let newRows = [];
        // For every row accumulated so far, add the flattened value from this key.
        for (const row of currentRows) {
          // Flatten the property value using the new key as prefix.
          const subRows = flattenRecursive(value, { ...row }, newKey);
          if (subRows.length === 0) {
            // If nothing came out of the property, assign null.
            const newRow = { ...row };
            newRow[newKey] = null;
            newRows.push(newRow);
          } else {
            newRows = newRows.concat(subRows);
          }
        }
        currentRows = newRows;
      }
      return currentRows;
    } else {
      // For a primitive value, assign it to the key given by the prefix.
      let newRow = { ...context };
      if (prefix) {
        newRow[prefix] = item;
      } else {
        // If no key is available, use a default key.
        newRow['value'] = item;
        fieldSet.add('value');
      }
      return [newRow];
    }
  }

  // Allow the top-level data to be an array or a single object.
  const inputArray = Array.isArray(data) ? data : [data];
  let flattened = [];
  for (const element of inputArray) {
    const rows = flattenRecursive(element);
    flattened = flattened.concat(rows);
  }

  // Filter out rows that are "blank" (i.e. every value is null/undefined or an empty string).
  const finalRows = flattened.filter(row =>
    Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '')
  );

  // Create an ordered array of field names (order here is based on encounter).
  const fieldOrder = Array.from(fieldSet);
  return { rows: finalRows, fieldOrder };
};
