// for callConnector
import { getDataByOutputKeys } from '../utils';

const ENV = {
  PROD: 'prod',
  PRT: 'prt',
  STAGING: 'staging',
};
const templateResultFunc = `export default function ({ response, config }, { throwStatusCodeError }) {
  return response.data
}
`;
const CUSTOM_HANDLE_ERROR = 'FZ_custom_handle_error';
const exampleParamsFunc = `export default function (options) {
  // 设置请求query、请求体、请求头
  // return {
  //   params: {
  //     pageSize: options.params.limit,
  //     pageNum: options.params.current
  //   },
  //   data: { key: 'example' },
  //   headers: { key: 'example' }
  // }
  return options
 }
`;
const SERVICE_TYPE = {
  DEFAULT: 'default',
  TG: 'tg',
  KDEV: 'kdev',
};

const exampleResultFunc = `export default function (data, config, { throwStatusCodeError }) {
  // 通过 data 可以修改返回值
  // return {
  //  total: data.all,
  //  dataSource: data.list.map({id, name} => ({
  //     value:id, label: name
  //  }))
  // }
  return data
}
`;
function getFullUrl(url, context) {
  const isFullUrl = /^HTTPS?\:\/\//i.test(url);
  if (!isFullUrl && context.projectData.debugDomain) {
    url = context.projectData.debugDomain + url;
  } else {
    url = isFullUrl ? url : location.origin + url;
  }
  return url;
}

function getDecodeString(fn) {
  return decodeURIComponent(fn).replace(
    /export\s+default.*function.*\(/,
    'function _RT_('
  );
}

function dispatchError(data, ...handleFns) {
  window['FZ_error_handle'] && window['FZ_error_handle'](data);
  window[`'${CUSTOM_HANDLE_ERROR}'`]?.(data);
  dispatchStatusCodeError(data);
  handleFns.forEach((fn) => fn(data));
}

function dispatchStatusCodeError(data) {
  window.dispatchEvent?.(
    new CustomEvent('statusCodeError', {
      detail: data,
    })
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

function handleResult(
  response,
  {
    resolve,
    reject,
    outputKeys,
    outputFn,
    resultFn,
    resultTransformDisabled,
    options,
  }
) {
  function handleGlobalConfig(response, { reject }) {
    if (response.status !== 200) {
      throw response;
    }
    // 全局配置中的返回结果处理函数
    const res = eval(`(${getDecodeString(resultFn)})`)(
      { response, config: Object.assign({}, options) },
      {
        throwStatusCodeError: (data) => {
          reject(data);
        },
      }
    );
    return res;
  }

  function handleSingleConfig(response, { reject }) {
    const res = eval(`(${outputFn || getDecodeString(exampleResultFunc)})`)(
      response,
      Object.assign({}, options),
      {
        throwStatusCodeError: (data) => {
          reject(data);
        },
      }
    );
    return res;
  }

  function handleSingeOutput(response, { resolve }) {
    if (resultTransformDisabled) {
      return resolve(response);
    }
    const outputData = getDataByOutputKeys(response, outputKeys);
    resolve(outputData);
  }

  const r1 = handleGlobalConfig(response, { resolve, reject });
  const r2 = handleSingleConfig(r1, { resolve, reject });
  handleSingeOutput(r2, { resolve, reject });
}

const utils = {
  ENV,
  templateResultFunc,
  CUSTOM_HANDLE_ERROR,
  SERVICE_TYPE,
  exampleResultFunc,
  exampleParamsFunc,
  getFullUrl,
  getDecodeString,
  dispatchError,
  dispatchStatusCodeError,
  getLast,
  getData,
  handleResult,
};

function getOptions(
  connector: any,
  params: any,
  config: any = {}
): {
  options: any;
  handleResult: (...parms: any) => any;
  handleError: (...params: any) => any;
} {
  const {
    context,
    handleError = () => {},
    debug,
    publishEnv,
    prefix = '',
    useProxyAfterPublish,
    resultTransformDisabled,
  } = config;
  const {
    getFullUrl,
    getDecodeString,
    exampleParamsFunc,
    SERVICE_TYPE,
    templateResultFunc,
    dispatchError
  } = utils;
  context.projectData.serviceTemplate =
    context.projectData.serviceTemplate || {};

  const serviceItem = connector.content
    ? connector
    : (context.projectData.serviceList || []).find(
        (item: any) => item.id === connector.id
      );

  const { input, output, method, path } = serviceItem.content;

  try {
    // 单个接口的入参处理
    const inputFn = getDecodeString(input);

    // 单个接口的（出参）返回结果处理
    const outputFn = getDecodeString(output);

    // 全局入参处理，类似于拦截器
    const paramsFn = getDecodeString(
      context.projectData.serviceTemplate.paramsFn || `${exampleParamsFunc}`
    );

    let url =
      path.startsWith('/') || /^HTTPS?\:\/\//i.test(path) ? path : `/${path}`;

    const newParams = eval(`(${paramsFn})`)(
      method === 'GET' ? { params, url } : { data: params, url }
    );
    newParams.url = newParams.url || url;
    const opts = eval(`(${inputFn})`)(newParams) || {};
    opts.method = opts.method || method;
    opts.url = opts.url || url;

    const options = opts;
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
      options.headers = Object.assign(
        { 'x-target-host': `${protocol}//${host}` },
        JSON.parse(debugHeaders),
        options.headers
      );
      if (host.includes('.staging')) {
        options.headers['x-target-staging'] = true;
      }
      const { cookie = '', Cookie = '' } = options.headers;
      if (cookie || Cookie) {
        options.headers['x-target-cookie'] = cookie || Cookie;
        Reflect.deleteProperty(options.headers, 'cookie');
        Reflect.deleteProperty(options.headers, 'Cookie');
      }
      if (type !== SERVICE_TYPE.TG) {
        // C端预置各环境泳道的场景
        const laneId =
          context.projectData.serviceTemplate?.[publishEnv]?.laneId;
        if (laneId) {
          options.headers['x-target-laneId'] = `{"laneId":"${laneId}"}`;
        }
        // C端预置各环境域名的场景
        const curDomainObj = context.projectData.serviceTemplate?.[publishEnv];
        if (curDomainObj) {
          options.headers['x-target-host'] =
            curDomainObj?.domain || curDomainObj;
        }
      }
      options.url = `${prefix}${pathname}${search}`;
    }
    const { resultFn = templateResultFunc } =
      context.projectData.serviceTemplate || {};

    return {
      options,
      handleError: (error, { reject }) => {
        // 捕获异步异常，包括接口模板、返回结果处理;
        dispatchError(error, handleError);
        // 异常抛出到组件库
        return reject(error);
      },
      handleResult: (response, { resolve, reject }) =>
        handleResult(response, {
          resolve,
          reject,
          options,
          outputFn,
          resultFn,
          resultTransformDisabled,
          outputKeys: serviceItem.content.outputKeys,
        }),
    };
  } catch (error) {
    // 捕获请求参数处理异常
    dispatchError(error, handleError);
    return Promise.reject(error);
  }
}

export { getOptions, utils };
