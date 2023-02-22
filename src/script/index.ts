// @ts-nocheck

import { exampleParamsFunc } from '../constant';

function getDecodeString(fn: string) {
  return fn
    ? decodeURIComponent(fn).replace(
        /export\s+default.*function.*\(/,
        'function _RT_('
      )
    : fn;
}

function getScript(serviceItem) {
  function fetch(params, { then, onError }, config) {
    function getLast(str) {
      return str.split('.').slice(-1)[0];
    }
    function getData(data, keys) {
      let res = data;
      keys.forEach((key) => (res = res[key]));
      return res;
    }
    function serviceAgent(params, config) {
      const method = `__method__`;
      const path = `__path__`;
      const outputKeys = __outputKeys__;
      const resultTransformDisabled = __resultTransformDisabled__;

      try {
        const url = path;
        const newParams = __globalParamsFn__(
          method === 'GET'
            ? { params, url, method }
            : { data: params, url, method }
        );
        const hasGlobalResultFn = __hasGlobalResultFn__;
        newParams.url = newParams.url || url;
        newParams.method = newParams.method || method;
        const options = __input__(newParams);
        options.url = (options.url || url).replace(/{(\w+)}/g, (match, key) => {
          const param = params[key] || '';
          Reflect.deleteProperty(options.params || {}, key);
          return param;
        });
        options.method = options.method || method;
        config
          .ajax(options)
          .then((response) => {
            if (hasGlobalResultFn) {
              const res = __globalResultFn__(
                { response, config: options },
                {
                  throwStatusCodeError: (data: any) => {
                    onError(data);
                  },
                }
              );
              return res;
            }
            return response;
          })
          .then((response) => {
            const res = __output__(response, Object.assign({}, options), {
              throwStatusCodeError: (data) => {
                onError(data);
              },
            });
            return res;
          })
          .then((response) => {
            if (resultTransformDisabled) {
              return then(response);
            }
            let outputData = {};
            if (outputKeys === void 0) {
              then(response);
              return;
            }
            if (outputKeys.length === 0) {
              outputData = response;
            } else if (outputKeys.length === 1) {
              outputData = getData(response, outputKeys[0].split('.'));
            } else {
              outputKeys.forEach((key) => {
                outputData[getLast(key)] = getData(response, key.split('.'));
              });
            }
            then(outputData);
          })
          .catch((error) => {
            onError((error && error.message) || error);
          });
      } catch (error) {
        return onError(error);
      }
    }
    return serviceAgent(params, config);
  }
  return encodeURIComponent(
    fetch
      .toString()
      .replace('__input__', getDecodeString(serviceItem.input))
      .replace('__output__', getDecodeString(serviceItem.output))
      .replace(
        '__globalResultFn__',
        serviceItem.globalResultFn
          ? getDecodeString(serviceItem.globalResultFn)
          : void 0
      )
      .replace(
        '__hasGlobalResultFn__',
        serviceItem.globalResultFn ? true : false
      )
      .replace('__method__', serviceItem.method)
      .replace('__path__', serviceItem.path.trim())
      .replace('__outputKeys__', JSON.stringify(serviceItem.outputKeys))
      .replace(
        '__resultTransformDisabled__',
        serviceItem.resultTransformDisabled
      )
      .replace(
        '__globalParamsFn__',
        getDecodeString(serviceItem.globalParamsFn || exampleParamsFunc)
      )
  );
}

export { getScript };
