import { isEmpty, get, set } from "../utils/lodash";
import { CUSTOM_HANDLE_ERROR } from "../constant"

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
  // @ts-ignore
  window['FZ_error_handle'] && window['FZ_error_handle'](data);
  // @ts-ignore
  window[`${CUSTOM_HANDLE_ERROR}`]?.(data);
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