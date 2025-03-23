export class JsonProcessor {
  constructor(config = {}) {
    this.config = {
      idPaths: ['id', 'guid', 'uuid', '_id', 'key', 'code'],
      namePaths: ['name', 'title', 'label', 'description'],
      datePaths: ['date', 'created', 'modified', 'timestamp'],
      ...config
    };
    
    this.stats = {
      processed: 0,
      structureMap: new Map()
    };
  }

  /**
   * Extracts section code from file name
   * @param {string} fileName - The name of the file
   * @returns {string|null} - The section code if found, null otherwise
   */
  extractSectionCode(fileName) {
    const match = fileName.match(/(ENR|AD|GEN)_(\d+)_(\d+)/);
    if (!match) return null;
    
    const [, type, section, subsection] = match;
    return `${type} ${section}.${subsection}`;
  }

  processArray(jsonArray) {
    if (!Array.isArray(jsonArray)) {
      throw new Error('Input must be an array of JSON objects');
    }
    
    const results = [];
    const schema = this.detectSchema(jsonArray[0]);
    
    const schemaKey = JSON.stringify(Object.keys(schema).sort());
    if (!this.stats.structureMap.has(schemaKey)) {
      this.stats.structureMap.set(schemaKey, 0);
    }
    this.stats.structureMap.set(schemaKey, this.stats.structureMap.get(schemaKey) + 1);
    
    for (const item of jsonArray) {
      const processed = this.processItem(item, schema);
      results.push(processed);
      this.stats.processed++;
    }
    
    return {
      results,
      schema,
      stats: this.getStats()
    };
  }

  detectSchema(sampleObject) {
    const schema = {};
    
    for (const [key, value] of Object.entries(sampleObject)) {
      const type = this.getValueType(value);
      
      schema[key] = {
        type,
        path: key,
        isNested: type === 'object' || type === 'array'
      };
      
      if (type === 'string' || type === 'number') {
        if (this.config.idPaths.includes(key.toLowerCase())) {
          schema[key].purpose = 'id';
        } else if (this.config.namePaths.includes(key.toLowerCase())) {
          schema[key].purpose = 'name';
        } else if (this.config.datePaths.includes(key.toLowerCase())) {
          schema[key].purpose = 'date';
        }
      }
      
      if (type === 'object' && value !== null) {
        schema[key].nestedSchema = this.detectSchema(value);
      } else if (type === 'array' && value.length > 0 && typeof value[0] === 'object') {
        schema[key].nestedSchema = this.detectSchema(value[0]);
      }
    }
    
    return schema;
  }

  processItem(item, schema) {
    const result = {
      _processed: true,
      _source: JSON.parse(JSON.stringify(item))
    };
    
    const id = this.findValueByPurpose(item, schema, 'id');
    if (id) result.id = id;
    
    const name = this.findValueByPurpose(item, schema, 'name');
    if (name) result.name = name;
    
    const date = this.findValueByPurpose(item, schema, 'date');
    if (date) result.date = date;
    
    result.fields = this.flattenObject(item);
    
    return result;
  }

  getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  findValueByPurpose(item, schema, purpose) {
    for (const [key, value] of Object.entries(schema)) {
      if (value.purpose === purpose) {
        return item[key];
      }
      
      if (value.isNested && value.nestedSchema) {
        if (value.type === 'object') {
          const nestedResult = this.findValueByPurpose(item[key], value.nestedSchema, purpose);
          if (nestedResult !== undefined) return nestedResult;
        } else if (value.type === 'array' && item[key]?.length > 0) {
          const nestedResult = this.findValueByPurpose(item[key][0], value.nestedSchema, purpose);
          if (nestedResult !== undefined) return nestedResult;
        }
      }
    }
  }

  flattenObject(obj, prefix = '') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  getStats() {
    return {
      processed: this.stats.processed,
      uniqueStructures: this.stats.structureMap.size,
      structureCounts: Object.fromEntries(this.stats.structureMap)
    };
  }
} 