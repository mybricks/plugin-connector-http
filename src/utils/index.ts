import { isEmpty, get, set } from "../utils/lodash";

export function getServiceUrl(uri: string) {
  return `/app/pcspa/desn/${uri}`
}

export function getDecodeString(fn: string) {
  return (decodeURIComponent(fn)).replace(/export\s+default.*function.*\(/, 'function _RT_(');
}

export function dispatchStatusCodeError(data: any) {
  window.dispatchEvent?.(new CustomEvent('statusCodeError', {
    detail: data
  }))
}

export function dispatchError(data: any, ...handleFns: any[]) {
  dispatchStatusCodeError(data);
  handleFns.forEach(fn => fn(data));
}

export function getLast(list: any[]) {
  return list[list.length - 1];
}

export function log(...args: any[]) {
  if (location?.search.includes('debug=true')) {
    console.log(...args)
  }
}

export function formatSchema(schema: any) {
  if (!schema) return;
  if (schema.type === 'object') {
    Object.values(schema.properties).forEach(item => {
      formatSchema(item)
    })
  } else if (schema.type === 'array') {
    if (isEmpty(schema.items)) {
      Object.defineProperty(schema, 'type', {
        writable: true,
        value: 'array'
      })
      Reflect.deleteProperty(schema, 'items');
    } else {
      if (schema.items.type === 'object') {
        Object.values(schema.items.properties).forEach(item => {
          formatSchema(item)
        })
      }
      // TODO oneOf
    }
  } else if (schema.type === 'null' || schema.type === 'undefined') {
    // TODO support null and undefined
    Object.defineProperty(schema, 'type', {
      writable: true,
      value: 'string'
    })
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
      outputData = outputData[Object.keys(outputData)[0]]
    }
  }
  return outputData;
}

export function params2data(params: any) {
  if (!params) return;
  let obj: any = {};

  if (params.type === 'string') {
    return params.defaultValue;
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

export function uuid() {
  let len = 6,
    seed = "abcdefhijkmnprstwxyz",
    maxPos = seed.length;
  let rtn = "";
  for (let i = 0; i < len; i++) {
    rtn += seed.charAt(Math.floor(Math.random() * maxPos));
  }
  return "u_" + rtn;
}
