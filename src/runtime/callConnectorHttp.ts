import axios from 'axios';
import { getDecodeString } from '../script';
import { cloneDeep } from '../utils/lodash';

interface IOptions {
  method: string;
  url: string;
  data: any;
  params: any;
  headers: any;
  [key: string]: any;
}

interface IConfig {
  /** axios 对象 */
  agent?: any;
  before: (options: IOptions) => any;
  onResponseInterception?(response): any;
}

const defaultFn = (options: IOptions, ...args: any) => ({
  ...options,
  ...args,
});

const httpRegExp = new RegExp('^(http|https)://');

export function call(
  connector: {
    id: string;
    script: string;
    useProxy?: boolean;
    executeEnv?: string;
    [key: string]: any
  },
  params: any,
  config?: IConfig
) {
  return new Promise((resolve, reject) => {
    try {
      const fn = connector.script ? eval(`(${decodeURIComponent(connector.script)})`) : getFetch(connector);
      const { before = defaultFn, ...otherConfig } = config || {};
      fn(
        params,
        { then: resolve, onError: reject },
        {
          ...otherConfig,
          ajax(options: IOptions) {
            const opts = before({ ...options });
            const { url } = opts;

            if (!url) {
              reject('请求路径不能为空');
            }

            if (!config?.agent && !axios) {
              reject('请检查应用 callConnector 配置，确保传入 agent 实例（即 axios）');
            }

            if (connector.useProxy && httpRegExp.test(url) && url.match(/^https?:\/\/([^/#&?])+/g)?.[0] !== location.origin) {
              return (config?.agent ?? axios)({
                  ...opts,
                  url: '/paas/api/proxy',
                  headers: {...(opts.headers || {}), ['x-target-url']: opts.url},
                  data: opts.data
                })
                .then((res: any) => {
                  config?.onResponseInterception?.(res);
                  return res.data;
                })
                .catch(error => {
                  error.response && config?.onResponseInterception?.(error.response);
                  throw error;
                });
            }

            return axios(opts || options)
              .then(res => {
                config?.onResponseInterception?.(res);
                return res.data;
              })
              .catch(error => {
                error.response && config?.onResponseInterception?.(error.response);
                throw error;
              });
          },
        }
      );
    } catch (ex) {
      console.log('连接器错误', ex);
      reject(`连接器script错误.`);
    }
  });
}

const setData = (data, keys, val) => {
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
};
const del = (data, keys) => {
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
};
const pluginRun = functionString => eval(`(() => { return ${functionString ? getDecodeString(functionString) : '_ => _;' }})()`);
const getFetch = (connector) => {
  return (params, { then, onError }, config) => {
    const method = connector.method;
    const path = connector.path.trim();
    const outputKeys = connector.outputKeys || [];
    const excludeKeys = connector.excludeKeys || [];
    const showLog = connector.mode === 'test';
    const markList = connector.markList || [];
    if (!markList.length) {
      markList.push({ title: '默认', id: 'default', predicate: {}, outputKeys, excludeKeys });
    }

    try {
      showLog && console.log('【连接器调试日志】接口传入参数：', cloneDeep(params));

      const url = path;
      const originParams = ['GET', 'DELETE'].includes(method) ? { params, data: {}, headers: {}, url, method } : { params: {}, data: params, headers: {}, url, method };

      showLog && console.log('【连接器调试日志】全局入参拦截器(执行前配置)：', cloneDeep(originParams));

      /** 全局入参处理 */
      const newParams = pluginRun(connector.globalParamsFn)(originParams);

      showLog && console.log('【连接器调试日志】全局入参拦截器(执行后配置)：', cloneDeep(newParams));

      newParams.url = newParams.url || url;
      newParams.method = newParams.method || method;

      showLog && console.log('【连接器调试日志】接口自定义入参拦截器(执行前配置)：', cloneDeep(newParams));

      /** 局部入参处理 */
      const options = pluginRun(connector.input)(newParams);

      showLog && console.log('【连接器调试日志】接口自定义入参拦截器(执行后配置)：', cloneDeep(options));
      showLog && console.log('【连接器调试日志】接口请求路径模板字符串处理(执行前配置)：', cloneDeep(options));
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

      showLog && console.log('【连接器调试日志】接口请求路径模板字符串处理(执行后配置)：', cloneDeep(options));

      options.method = options.method || method;
      let hasCallThrowError = false;
      let curOutputKeys = [];
      let curExcludeKeys = [];
      let curOutputId = 'then';
      config
        .ajax(options)
        .catch(error => {
          /** 拦截函数存在，且是接口请求错误 */
          if (connector.globalErrorResultFn && (!!error.response || error.name === 'AxiosError')) {
            const response = error.response || { data: {} };
            !response.data && (response.data = {});
            pluginRun(connector.globalErrorResultFn)(
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
          showLog && console.log('【连接器调试日志】全局出参拦截器(执行前数据)：', cloneDeep(response));

          /** 全局响应值处理 */
          const result = pluginRun(connector.globalResultFn)({ response, config: options }, { throwError: onError });

          showLog && console.log('【连接器调试日志】全局出参拦截器(执行后数据)：', cloneDeep(result));
          return result;
        })
        .then((response) => {
          showLog && console.log('【连接器调试日志】接口自定义出参拦截器(执行前数据)：', cloneDeep(response));

          /** 局部响应值处理 */
          const result = pluginRun(connector.output)(response, Object.assign({}, options), { throwError: onError });

          showLog && console.log('【连接器调试日志】接口自定义出参拦截器(执行后数据)：', cloneDeep(result));
          for (let i = 0; i < markList.length; i++) {
            const { id, predicate = { key: '', value: undefined }, excludeKeys, outputKeys } = markList[i];

            if (!predicate || !predicate.key || predicate.value === undefined) {
              curOutputKeys = outputKeys;
              curExcludeKeys = excludeKeys;
              curOutputId = id === 'default' ? 'then' : id;
              break;
            }

            let curResult = result, keys = (predicate.key as string).split('.');
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
          if (connector.mode === 'test') {
            then(response);
            return;
          }
          curExcludeKeys?.forEach((key) => del(response, key.split('.')));

          return response;
        })
        .then((response) => {
          let outputData: any = Array.isArray(response) ? [] : {};
          if (curOutputKeys === void 0 || curOutputKeys.length === 0) {
            outputData = response;
          } else {
            curOutputKeys.forEach((key) => {
              setData(response, key.split('.'), outputData);
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
                console.log('connector format data error', e);
              }
            }
          }

          then(config.isMultipleOutputs ? { __OUTPUT_ID__: curOutputId, __ORIGIN_RESPONSE__: outputData } : outputData);
        })
        .catch((error) => {
          if (error?.message === 'HTTP_FETCH_ERROR') {
            if (connector.globalErrorResultFn && !hasCallThrowError) {
              onError('全局拦截响应错误函数中必须调用 throwError 方法，请前往修改');
            }
          } else {
            onError(error?.message || error);
          }
        });
    } catch (error) {
      return onError(error);
    }
  };
};
