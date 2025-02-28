// @ts-nocheck

import { exampleParamsFunc } from '../constant';

export function getDecodeString(fn: string) {
  if (fn) {
    const decodeFn = decodeURIComponent(fn);
    const exportCodeMatch = decodeFn.match(/export\s+default.*function.*\(/);
    return decodeFn.replace(
      /export\s+default.*function.*\(/,
      exportCodeMatch[0]?.includes("async") ? 'async function _RT_(' :  'function _RT_('
    )
  }

  return fn;
  // return fn
  //   ? decodeURIComponent(fn).replace(
  //       /export\s+default.*function.*\(/,
  //       'async function _RT_('
  //     )
  //   : fn;
}

function getScript(serviceItem) {
  function fetch(params, { then, onError }, config) {
    function setData(data, keys, val) {
      const len = keys.length;
      function dfs(res, index, val) {
        if (!res || index === len) {
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
        if (!data || index === len) return;
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
      const method = `__method__`;
      const path = `__path__`;
      const outputKeys = __outputKeys__;
      const excludeKeys = __excludeKeys__;
      const isTestMode = __isTestMode__;
      const globalErrorResultFn = __globalErrorResultFn__;
      const markList = __markList__;
      if (!markList.length) {
        markList.push({ title: '默认', id: 'default', predicate: {}, outputKeys, excludeKeys });
      }

      try {
        const url = path;
        const newParams = __globalParamsFn__(
          ['GET', 'DELETE'].includes(method) ? { params, data: {}, headers: {}, url, method } : { params: {}, data: params, headers: {}, url, method }
        );
        const hasGlobalResultFn = __hasGlobalResultFn__;
        newParams.url = newParams.url || url;
        newParams.method = newParams.method || method;
        const options = __input__(newParams);
        const currentParams = ['GET', 'DELETE'].includes(options.method) ? options.params : options.data;
        const isObjectBody = typeof currentParams === 'object';
        if (isObjectBody) {
          const isFormData = currentParams instanceof FormData;
          const templateParamKeys = [];
          /** url 里支持模板字符串 */
          options.url = (options.url || url).replace(/{([^}]+)}/g, (match, key) => {
            const keys = key ? key.split('.') : [];
            let curParams = currentParams;

            if (!keys.length) {
              onError(`请求路径中模板字符串错误`);
            }
            let index = 0;
            templateParamKeys.push(keys[0]);
            while (keys.length) {
              const curKey = keys.shift();
              if (!curParams) {
                onError(`请求路径中模板字符串的参数(${key})缺失`);
                return ;
              }
              let value = curParams[curKey];
              if (curParams instanceof FormData) {
                value = curParams.get(curKey);

                /** 存在嵌套变量 */
                if (index === 0 && keys.length) {
                  try {
                    value = JSON.parse(value);
                  } catch {
                    onError(`请求路径中模板字符串的参数(${key})缺失`);
                    return ;
                  }
                }
              }

              if (value === undefined || value === null) {
                onError(`请求路径中模板字符串的参数(${key})缺失`);
              }

              index++;
              curParams = value;
            }

            return curParams;
          });
          if (isFormData) {
            templateParamKeys.forEach(key => {
              currentParams.delete(key)
            });

            currentParams.delete('MYBRICKS_HOST')
          } else {
            templateParamKeys.forEach(key => {
              Reflect.deleteProperty(currentParams || {}, key);
            });
            Reflect.deleteProperty(currentParams || {}, 'MYBRICKS_HOST');
          }
        }
        options.method = options.method || method;
        let hasCallThrowError = false;
        let curOutputKeys = [];
        let curExcludeKeys = [];
        let curOutputId = 'then';
        config
          .ajax(options)
          .catch(error => {
            /** 拦截函数存在，且是接口请求错误 */
            if (globalErrorResultFn && (!!error.response || error.name === 'AxiosError')) {
              const response = error.response || { data: {} };
              !response.data && (response.data = {});
              globalErrorResultFn(
                { error, response, config: options },
                {
                  throwError: (...args) => {
                    hasCallThrowError = true;
                    onError(...args);
                  }
                }
              );
            } else {
              onError(error);
            }

            throw Error('HTTP_FETCH_ERROR');
          })
          .then((response) => {
            if (hasGlobalResultFn) {
              return __globalResultFn__({response, config: options}, { throwError: onError });
            }
            return response;
          })
          .then((response) => {
            const result = __output__(response, Object.assign({}, options), { throwError: onError });
            for (let i = 0; i < markList.length; i++) {
              const { id, predicate = { key: '', value: undefined }, excludeKeys, outputKeys } = markList[i];

              if (!predicate || !predicate.key || predicate.value === undefined) {
                curOutputKeys = outputKeys;
                curExcludeKeys = excludeKeys;
                curOutputId = id === 'default' ? 'then' : id;
                break;
              }

              let curResult = result, keys = predicate.key.split('.');
              while (curResult && keys.length) {
                curResult = curResult[keys.shift()];
              }

              if (!keys.length && (predicate.operator === '=' ? curResult === predicate.value : curResult !== predicate.value)) {
                curOutputKeys = outputKeys;
                curExcludeKeys = excludeKeys;
                curOutputId = id === 'default' ? 'then' : id;
                break;
              }
            }
            return result;
          })
          .then((response) => {
            if (isTestMode) {
              then(response);
              return;
            }
            if (curExcludeKeys.length === 0) {
              return response;
            }
            curExcludeKeys.forEach(key => del(response, key.split('.')));
            return response;
          })
          .then((response) => {
	          let outputData: any = Array.isArray(response) ? [] : {};
            if (curOutputKeys === void 0 || curOutputKeys.length === 0) {
              outputData = response;
            } else {
              curOutputKeys.forEach((key) => {
                setData(response, key.split('.'), outputData)
              });
							
	            /** 当标记单项时，自动返回单项对应的值 */
	            if (Array.isArray(curOutputKeys) && curOutputKeys.length && (curOutputKeys.length > 1 || !(curOutputKeys.length === 1 && curOutputKeys[0] === ''))) {
		            try {
			            let cascadeOutputKeys = curOutputKeys.map(key => key.split('.'));
			            while (Object.prototype.toString.call(outputData) === '[object Object]' && cascadeOutputKeys.every(keys => !!keys.length) && Object.values(outputData).length === 1) {
				            outputData = Object.values(outputData)[0];
				            cascadeOutputKeys.forEach(keys => keys.shift());
			            }
		            } catch(e) {
									console.log('连接器内置数据转换失败，错误是：', e);
		            }
	            }
            }
            then(config.isMultipleOutputs ? { __OUTPUT_ID__: curOutputId, __ORIGIN_RESPONSE__: outputData } : outputData);
          })
          .catch((error) => {
            if (error && error.message === 'HTTP_FETCH_ERROR') {
              if (globalErrorResultFn && !hasCallThrowError) {
                onError('全局拦截响应错误函数中必须调用 throwError 方法，请前往修改');
              }
            } else {
              onError((error && error.message) || error);
            }
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
        '__globalErrorResultFn__',
        serviceItem.globalErrorResultFn
          ? getDecodeString(serviceItem.globalErrorResultFn)
          : void 0
      )
      .replace('__markList__', JSON.stringify((serviceItem.markList || []).map(({ outputSchema, resultSchema, ...other }) => other)))
      .replace(
        '__hasGlobalResultFn__',
        JSON.stringify(!!serviceItem.globalResultFn)
      )
      .replace('__method__', serviceItem.method)
      .replace('__isTestMode__', JSON.stringify(serviceItem.isTestMode || false))
      .replace('__path__', serviceItem.path.trim())
      .replace('__outputKeys__', JSON.stringify(serviceItem.outputKeys || []))
      .replace('__excludeKeys__', JSON.stringify(serviceItem.excludeKeys || []))
      .replace(
        '__globalParamsFn__',
        getDecodeString(serviceItem.globalParamsFn || exampleParamsFunc)
      )
  );
}

function getJsScript(jsItem) {
  return encodeURIComponent(getDecodeString(jsItem.output));
}

export { getScript, getJsScript };
