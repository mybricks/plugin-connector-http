export const PLUGIN_CONNECTOR_NAME = '@mybricks/plugins/service';

export const exampleParamsFunc = `export default function ({ params, data, headers, url, method }) {
  // 设置请求query、请求体、请求头
  return { params, data, headers, url, method };
 }
`;

export const exampleResultFunc = `export default function (result, { method, url, params, data, headers }, { throwError }) {
  // return {
  //  total: result.all,
  //  dataSource: result.list.map({id, name} => ({
  //     value:id, label: name
  //  }))
  // }
  return result;
}
`;

export const templateResultFunc = `export default function ({ response, config }, { throwError }) {
  // if (response.code !== 0) {
  //    throwError(response.errMsg);
  //    throwError({ message: response.errMsg || '我是复杂错误对象' });
  // }
  return response
}
`;

export const templateErrorResultFunc = `export default function handleError({ error, response, config }, { throwError }) {
  // 错误抛出时预处理数据，请注意：必须调用 throwError 抛出错误;
  // config：请求入参；error：错误对象；response：响应原始对象；response.status：获取 HTTP 状态码，response.data：获取接口返回值
  throwError(response.data.message || error.message || error);
}
`;

export const SERVICE_TYPE = {
  HTTP: 'http',
  TG: 'http-tg',
  KDEV: 'http-kdev',
  FOLDER: 'folder',
};

export const GLOBAL_PANEL = 'global-setting';

export let CDN = {
  eslint: '/mfs/editor_assets/eslint/8.15.0/eslint.js',
  paths: {
    vs: '/mfs/editor_assets/monaco-editor/0.33.0/min/vs',
  },
  babel: '/mfs/editor_assets/babel/babel-standalone.min.js'
};

export const resetCDN = () => {
  CDN = undefined;
};

export const MarkList = [
  { key: 'predicate', title: '标记组生效标识', description: '标识标记组满足对应条件生效', needMarkValue: true },
  { key: 'output', title: '返回内容', description: '当标记组生效时，返回此标记对应内容' }
];
export const MarkTypeLabel = {
  predicate: '生效标识',
  output: '返回内容',
};
export const MarkTypes = {
  predicate: ['number', 'string', 'boolean'],
  output: ['any']
};

export enum Methods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}