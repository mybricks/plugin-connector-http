// @ts-nocheck

import { exampleParamsFunc } from '../constant';

function getScript(serviceItem) {
  function fetch(params, { then, onError }, config) {
    function getDecodeString(fn: string) {
      return decodeURIComponent(fn).replace(
        /export\s+default.*function.*\(/,
        'function _RT_('
      );
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
      const method = `__method__`;
      const path = `__path__`;
      const outputKeys = __outputKeys__;
      const resultTransformDisabled = __resultTransformDisabled__;
      const mockAddress = __mockAddress__;

      try {
        const inputFn = getDecodeString(input);
        const outputFn = getDecodeString(output);
        globalParamsFn = getDecodeString(globalParamsFn);
        const url = path;
        const newParams = eval(`(${globalParamsFn})`)(
          method === 'GET' ? { params, url } : { data: params, url }
        );
        newParams.url = url;
        const options = eval(`(${inputFn})`)(newParams);
        options.method = options.method || method;
        options.url = mockAddress ? mockAddress : options.url || url;
        config
          .ajax(options)
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
            onError(error);
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
      .replace('__method__', serviceItem.method)
      .replace('__path__', serviceItem.path)
      .replace('__outputKeys__', JSON.stringify(serviceItem.outputKeys))
      .replace(
        '__resultTransformDisabled__',
        serviceItem.resultTransformDisabled
      )
      .replace(
        '__mockAddress__',
        serviceItem.mockAddress ? `'${serviceItem.mockAddress}'` : false
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
