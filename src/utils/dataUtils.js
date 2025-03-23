export const flattenNestedData = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { rows: [], fieldOrder: [] };
  }

  const sourceData = data[0]._source ? data.map(item => item._source) : data;
  const flattenedRows = [];
  const fieldOrder = [];
  
  const trackField = (key) => {
    if (!fieldOrder.includes(key)) {
      fieldOrder.push(key);
    }
  };

  const processItem = (item, parentData = {}, prefix = '') => {
    if (!item || typeof item !== 'object') return;
    
    const baseData = { ...parentData };
    const nestedArrays = {};
    
    Object.entries(item).forEach(([key, value]) => {
      const newKey = prefix ? 
        (prefix === 'Routes' ? key : `${prefix}.${key}`) : 
        key;
      
      trackField(newKey);
      
      if (Array.isArray(value)) {
        nestedArrays[key] = value;
      } else if (value && typeof value === 'object') {
        processItem(value, baseData, newKey);
      } else {
        baseData[newKey] = value;
      }
    });
    
    if (Object.keys(nestedArrays).length === 0) {
      if (Object.keys(baseData).length > 0) {
        flattenedRows.push(baseData);
      }
      return;
    }
    
    Object.entries(nestedArrays).forEach(([arrayKey, arrayItems]) => {
      if (!arrayItems || arrayItems.length === 0) {
        flattenedRows.push(baseData);
      } else {
        arrayItems.forEach(arrayItem => {
          if (typeof arrayItem === 'object' && arrayItem !== null) {
            const newPrefix = arrayKey === 'Routes' ? '' : arrayKey;
            processItem(arrayItem, { ...baseData }, newPrefix);
          } else {
            const newKey = arrayKey === 'Routes' ? 'value' : arrayKey;
            flattenedRows.push({
              ...baseData,
              [newKey]: arrayItem
            });
          }
        });
      }
    });
  };
  
  sourceData.forEach(item => processItem(item));
  
  return { rows: flattenedRows, fieldOrder };
}; 