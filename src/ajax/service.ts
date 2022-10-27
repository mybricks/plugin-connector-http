import { getDecodeString, dispatchError, getDataByOutputKeys } from '../utils';
import {
  ENV,
  CUSTOM_HANDLE_ERROR,
  exampleParamsFunc,
  SERVICE_TYPE,
  exampleResultFunc,
} from '../constant';

interface IConfig {
  context: any;
  agent?: any;
  prefix?: string;
  publishEnv: string;
  useProxyAfterPublish?: boolean;
  debug?: boolean;
  handleError: (data: any) => void;
  formatResponse?: string;
  serviceItem: any;
  resultTransformDisabled?: boolean;
}

function getLast(str: string = '') {
  return str.split('.').slice(-1)[0];
}

function ajaxMethod(url: string | object, opts: any, config: IConfig) {
  if (typeof url === 'object') {
    config = opts;
    opts = url;
  } else {
    opts = Object.assign({ url: url, method: 'get' }, opts);
  }

  if (!opts.url) {
    return Promise.reject(null);
  }

  const {
    context,
    agent,
    prefix = '/app/pcspa/desn/proxy',
    useProxyAfterPublish,
    debug,
    publishEnv,
    serviceItem = {},
    handleError = () => {},
    resultTransformDisabled,
  } = config;

  // @ts-ignore
  window[`${CUSTOM_HANDLE_ERROR}`] = handleError;

  const options = { ...opts };

  // debug: ture表示在FZ调试
  // useProxyAfterPublish: 页面发布出去后是否代理网络请求
  if (debug || useProxyAfterPublish) {
    const { useMock, mockAddress, type } = serviceItem;
    const isValidMock = useMock && mockAddress;
    const url = isValidMock ? mockAddress : options.url;
    options.url = getFullUrl(url, context);

    if (isValidMock) {
      options.method = 'GET';
    }

    const debugHeaders = decodeURIComponent(
      context.projectData.debugHeaders || '{}'
    );

    const { search, pathname, host, protocol } = new URL(options.url);
    options.headers = {
      'x-target-host': `${protocol}//${host}`,
      ...JSON.parse(debugHeaders),
      ...options.headers,
    };
    if (host.includes('.staging')) {
      options.headers['x-target-staging'] = true;
    }
    const { cookie = '', Cookie = '', ...others } = options.headers;
    options.headers = {
      ...others,
    };
    if (cookie || Cookie) {
      options.headers['x-target-cookie'] = cookie || Cookie;
    }
    if (type !== SERVICE_TYPE.TG) {
      // C端预置各环境泳道的场景
      const laneId = context.projectData.serviceTemplate?.[publishEnv]?.laneId;
      if (laneId) {
        options.headers['x-target-laneId'] = `{"laneId":"${laneId}"}`;
      }
      // C端预置各环境域名的场景
      const curDomainObj = context.projectData.serviceTemplate?.[publishEnv];
      if (curDomainObj) {
        options.headers['x-target-host'] = curDomainObj?.domain || curDomainObj;
      }
    }
    options.url = `${prefix}${pathname}${search}`;
  }

  return new Promise((resolve, reject) => {
    agent(options)
      .then((response: any) => {
        if (response.status !== 200) {
          throw response;
        }
        // 模板函数
        // const res = eval(`(${getDecodeString(resultFn)})`)(
        //   { response, config: options },
        //   {
        //     throwStatusCodeError: (data: any) => {
        //       reject(data);
        //     },
        //   }
        // );
        return response.data;
      })
      // 结果处理函数
      .then((response: any) => {
        const res = eval(
          `(${serviceItem.outputFn || getDecodeString(exampleResultFunc)})`
        )(response, options, {
          throwStatusCodeError: (data: any) => {
            reject(data);
          },
        });
        return res;
      })
      .then((response: any) => {
        if (resultTransformDisabled) {
          return resolve(response);
        }
        const outputData = getDataByOutputKeys(
          response,
          serviceItem.outputKeys
        );
        resolve(outputData);
      })
      .catch((error: any) => {
        // 捕获接口模板中resultFn的异常、状态码大于400
        reject(error);
      });
  });
}

function serviceAgent(id: any, params: any, config: IConfig) {
  const { context, handleError = () => {}, debug, publishEnv } = config;
  context.projectData.serviceTemplate =
    context.projectData.serviceTemplate || {};
  const serviceItem =
    typeof id === 'object'
      ? id
      : [
          ...(context.projectData.serviceList || []),
          ...(context.projectData.globalServiceList || []),
        ].find((item) => item.id === id);

  const { input, output, method, path, apiName } = serviceItem.content;

  try {
    // 单个接口的入参处理
    const inputFn = getDecodeString(input);

    // 单个接口的（出参）返回结果处理
    const outputFn = getDecodeString(output);

    // 全局入参处理，类似于拦截器
    const paramsFn = getDecodeString(
      context.projectData.serviceTemplate.paramsFn || exampleParamsFunc
    );

    let url =
      path.startsWith('/') || /^HTTPS?\:\/\//i.test(path) ? path : `/${path}`;

    const newParams = eval(`(${paramsFn})`)(
      method === 'GET' ? { params, url } : { data: params, url }
    );
    const opts = {
      method,
      url,
      ...eval(`(${inputFn})`)({ url, ...newParams }),
    };

    return ajaxMethod(opts.url, opts, {
      ...config,
      serviceItem: { ...serviceItem.content, type: serviceItem.type, outputFn },
    }).catch((error: any) => {
      // 捕获异步异常，包括接口模板、返回结果处理
      dispatchError(error, handleError);
      // 异常抛出到组件库
      return Promise.reject(error);
    });
  } catch (error) {
    // 捕获请求参数处理异常
    dispatchError(error, handleError);
    return Promise.reject(error);
  }
}

function getFullUrl(url: string, context: any) {
  const isFullUrl = /^HTTPS?\:\/\//i.test(url);
  if (!isFullUrl && context.projectData.debugDomain) {
    url = context.projectData.debugDomain + url;
  } else {
    url = isFullUrl ? url : location.origin + url;
  }
  return url;
}

function callConnector(connector: any = {}, params: any, config: any) {
  return new Promise((resolve, reject) => {
    if (typeof connector.script === 'string') {
      try {
        const fn = eval(`(${decodeURIComponent(connector.script)})`);
        fn(
          params,
          { then: resolve, onError: reject },
          { ajax: config.agent }
        );
      } catch (ex) {
        reject(`连接器script错误: ${ex}`);
      }
    } else {
      reject(`连接器错误`);
    }
  });
}

export { ENV, ajaxMethod, serviceAgent, callConnector };
