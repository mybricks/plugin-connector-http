// @ts-nocheck

import { exampleParamsFunc } from '../constant';

function getScript(serviceItem) {
  function fetch(params, { then, onError }, config) {
    function getDecodeString(fn: string) {
      return fn
        ? decodeURIComponent(fn).replace(
            /export\s+default.*function.*\(/,
            'function _RT_('
          )
        : fn;
    }
    function getLast(str) {
      return str.split('.').slice(-1)[0];
    }
    function getData(data, keys) {
      let res = data;
      keys.forEach((key) => (res = res[key]));
      return res;
    }
    function serviceAgent(params, config) {
      const input = __input__;
      const output = __output__;
      let globalParamsFn = __globalParamsFn__;
      let globalResultFn = __globalResultFn__;
      const method = `__method__`;
      const path = `__path__`;
      const outputKeys = __outputKeys__;
      const resultTransformDisabled = __resultTransformDisabled__;

      try {
        const inputFn = getDecodeString(input);
        const outputFn = getDecodeString(output);
        globalParamsFn = getDecodeString(globalParamsFn);
        globalResultFn = getDecodeString(globalResultFn);
        const url = path;
        const newParams = eval(`(${globalParamsFn})`)(
          method === 'GET'
            ? { params, url, method }
            : { data: params, url, method }
        );
        newParams.url = newParams.url || url;
        newParams.method = newParams.method || method;
        const options = eval(`(${inputFn})`)(newParams);
        options.url = (options.url || url).replace(/{(\w+)}/g, (match, key) => {
          const param = params[key] || '';
          Reflect.deleteProperty(options.params || {}, key);
          return param;
        })
        options.method = options.method || method;
        config
          .ajax(options)
          .then((response) => {
            if (globalResultFn) {
              const res = eval(`(${globalResultFn})`)(
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
            const res = eval(`(${outputFn})`)(
              response,
              Object.assign({}, options),
              {
                throwStatusCodeError: (data) => {
                  onError(data);
                },
              }
            );
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
      .replace('__input__', '`' + serviceItem.input + '`')
      .replace('__output__', '`' + serviceItem.output + '`')
      .replace(
        '__globalResultFn__',
        serviceItem.globalResultFn
          ? '`' + serviceItem.globalResultFn + '`'
          : void 0
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
        '`' +
          (serviceItem.globalParamsFn ||
            decodeURIComponent(exampleParamsFunc)) +
          '`'
      )
  );
}

export { getScript };
