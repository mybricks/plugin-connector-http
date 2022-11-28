import { isEmpty, get, set } from '../utils/lodash';

export function getServiceUrl(uri: string) {
  return `/app/pcspa/desn/${uri}`;
}

export function getDecodeString(fn: string) {
  return decodeURIComponent(fn).replace(
    /export\s+default.*function.*\(/,
    'function _RT_('
  );
}

export function getLast(list: any[]) {
  return list[list.length - 1];
}

export function formatSchema(schema: any) {
  if (!schema) return;
  if (schema.type === 'object') {
    Object.values(schema.properties).forEach((item) => {
      formatSchema(item);
    });
  } else if (schema.type === 'array') {
    if (isEmpty(schema.items)) {
      Object.defineProperty(schema, 'type', {
        writable: true,
        value: 'array',
      });
      Reflect.deleteProperty(schema, 'items');
    } else {
      if (schema.items.type === 'object') {
        Object.values(schema.items.properties).forEach((item) => {
          formatSchema(item);
        });
      }
      // TODO oneOf
    }
  } else if (schema.type === 'null' || schema.type === 'undefined') {
    // TODO support null and undefined
    Object.defineProperty(schema, 'type', {
      writable: true,
      value: 'string',
    });
  }
}

export function getDataByOutputKeys(data, outputKeys) {
  let outputData: any = {};
  if (outputKeys === void 0 || outputKeys.length === 0) {
    outputData = data;
  } else if (outputKeys.length === 1) {
    outputData = get(data, outputKeys[0], data);
  } else {
    outputKeys.forEach((key: string) => {
      set(outputData, key, get(data, key));
    });
    if (Object.keys(outputData).length === 1) {
      outputData = outputData[Object.keys(outputData)[0]];
    }
  }
  return outputData;
}

export function params2data(params: any) {
  if (!params) return;
  let obj: any = {};

  if (params.type === 'string') {
    return params.defaultValue || '';
  }
  if (params.type === 'number') {
    return +params.defaultValue;
  }

  if (params.children) {
    if (params.type === 'array') {
      obj = [];
    }
    params.children.forEach((child: any) => {
      obj[child.name] = params2data(child);
    });
  }

  return obj;
}

export function uuid(len = 6) {
  const seed = 'abcdefhijkmnprstwxyz';
  const maxPos = seed.length;
  let rtn = '';
  for (let i = 0; i < len; i++) {
    rtn += seed.charAt(Math.floor(Math.random() * maxPos));
  }
  return 'u_' + rtn;
}

export function schema2data(schema: any) {
  function getBasicData(schema: any) {
    const { type } = schema;

    if (schema.default !== void 0 && schema.default !== '') {
      return schema.default;
    }

    if (type === 'string') {
      const { minLength = 0, maxLength = 8 } = schema;
      const min = +minLength;
      const max = +maxLength;
      const str = uuid(max).slice(
        max - Math.round(min + Math.random() * (max - min))
      );
      return str;
    } else {
      const { minimum = 0, maximum = 100 } = schema;
      const min = +minimum;
      const max = +maximum;
      return min + Math.round(Math.random() * (max - min));
    }
  }
  function uuid(len = 6) {
    const seed = 'abcdefhijkmnprstwxyz';
    const maxPos = seed.length;
    let rtn = '';
    for (let i = 0; i < len; i++) {
      rtn += seed.charAt(Math.floor(Math.random() * maxPos));
    }
    return rtn;
  }
  function mockSchemaData(schema: any) {
    if (!schema) return;
    let obj: any;
    const { type } = schema;
    if (type === 'string' || type === 'number') {
      return getBasicData(schema);
    }

    if (type === 'array') {
      obj = [];
      const { minItems = 1, maxItems = 5 } = schema;
      const len = minItems + Math.round(Math.random() * (maxItems - minItems));
      for (let i = 0; i < len; i++) {
        const value = schema2data(schema.items);
        if (value !== null && value !== void 0) {
          obj.push(value);
        }
      }
    }
    if (schema.type === 'object') {
      obj = {};
      Object.keys(schema.properties || {}).forEach((key) => {
        obj[key] = schema2data(schema.properties[key]);
      });
    }
    return obj;
  }
  return mockSchemaData(schema);
}

export function jsonToSchema(json: any): any {
  const schema = { type: void 0 };
  proItem({ schema, val: json });
  if (schema.type) {
    return schema;
  } else {
    return;
  }
}

function proItem({ schema, val, key, fromAry }: { schema: any; val: any; key?: string; fromAry?: any[] }) {
  if (Array.isArray(val)) {
    const items = val.length ? {} : void 0 ;
    if (key) {
      schema[key] = {
        type: 'array',
        items
      };
      if (items) {
        schema[key].items = items;
      }
    } else {
      schema.type = 'array';
      if (items) {
        schema.items = items;
      }
    }

    proAry(items, val);
  } else {
    if (typeof val === 'object' && val) {
      let nSchema;
      if (fromAry) {
        schema.type = 'object';
        nSchema = schema.properties = {};
      }

      const properties = fromAry ? nSchema : {};

      if (!fromAry) {
        if (key) {
          schema[key] = {
            type: 'object',
            properties
          };
        } else {
          schema.type = 'object';
          schema.properties = properties;
        }
      }

      proObj(properties, val);
    } else {
      const type = val === null || val === void 0 ? 'unknown' : typeof val;
      if (key === void 0) {
        schema.type = type;
      } else {
        schema[key] = { type }
      }
    }
  }
}

function proObj(curSchema: any, obj: any) {
  Object.keys(obj).map((key) => {
    return proItem({ schema: curSchema, val: obj[key], key });
  });
}

function proAry(curSchema, ary) {
  if (!curSchema) return;
  let sample;
  if (ary.length > 0) {
    sample = ary[0];
  }

  proItem({ schema: curSchema, val: sample, fromAry: true });
}

export function safeDecode(code: string) {
  try {
    return decodeURIComponent(code);
  } catch (error) {
    return code;
  }
}