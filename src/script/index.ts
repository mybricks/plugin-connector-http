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
    function setData(data, keys, val) {
      const len = keys.length;
      function dfs(res, index, val) {
        if (index === len) {
          return res;
        }
        const key = keys[index];
        if (Array.isArray(res)) {
          return res.map((item, i) => {
            const curVal = val[i];
            let obj;
            if (curVal === void 0) {
              obj = {};
              val.push(obj);
            } else {
              obj = curVal;
            }
            return dfs(item, index, obj);
          });
        } else {
          if (index === len - 1) {
            val[key] = res[key];
            return res[key];
          }
          res = res[key];
          if (Array.isArray(res)) {
            val[key] = val[key] || [];
          } else {
            val[key] = val[key] || {};
          }
        }
        return dfs(res, index + 1, Array.isArray(val) ? val : val[key]);
      }
      return dfs(data, 0, val);
    }
    function del(data, keys) {
      const len = keys.length;
      function dfs(data, index) {
        if (index === len) return;
        const key = keys[index];
        if (index === len - 1) {
          Reflect.deleteProperty(data, key);
        }
        if (Array.isArray(data)) {
          data.forEach((item) => {
            dfs(item, index);
          });
        } else {
          dfs(data[key], index + 1);
        }
      }
      dfs(data, 0);
    }
    function serviceAgent(params, config) {
      const input = __input__;
      const output = __output__;
      let globalParamsFn = __globalParamsFn__;
      let globalResultFn = __globalResultFn__;
      const method = `__method__`;
      const path = `__path__`;
      const outputKeys = __outputKeys__;
      const excludeKeys = __excludeKeys__;
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
        });
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
            if (excludeKeys.length === 0) {
              return response;
            }
            excludeKeys.forEach((key) => {
              const keys = key.split('.');
              del(response, keys);
            });
            return response;
          })
          .then((response) => {
            let outputData = {};
            if (outputKeys === void 0 || outputKeys.length === 0) {
              outputData = response;
            } else {
              outputKeys.forEach((key) => {
                setData(response, key.split('.'), outputData)
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
      .replace('__excludeKeys__', JSON.stringify(serviceItem.excludeKeys || []))
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
