export const exampleParamsFunc = `export default function ({ params, data, headers }) {
  // 设置请求query、请求体、请求头
  return { params, data, headers };
 }
`

export const exampleResultFunc = `export default function (result, { method, url, params, data, headers }) {
  // return {
  //  total: result.all,
  //  dataSource: result.list.map({id, name} => ({
  //     value:id, label: name
  //  }))
  // }
  return result;
}
`
export const exampleTgResultFunc = `export default function (result, { method, url, params, data, headers }) {
  const list = [];
  if (result.code === 0) {
    result.data.rows.forEach(({ fields }) => {
      fields.forEach(({ tableFieldName, tableFieldValue }) => {
        list.push({
          [tableFieldName]: tableFieldValue.fieldValue,
        });
      });
    });
  }
  return list;
}
`

export const templateResultFunc = `export default function ({ response, config }, { throwStatusCodeError }) {
  return response.data
}
`

export const exampleTgParamsFunc = `export default function (options) {
  return {
    ...options,
    data: {
      apiName: '{{apiName}}',
      token: '{{token}}',
      key: { ...options.data }
    }
  }
 }
`
export const defaultTransformFn = '((p) => p)'

export const CUSTOM_HANDLE_ERROR = 'FZ_custom_handle_error';
export interface ServiceConfig {
  id?: string | number;
  title?: string;
  desc?: string;
  method: string;
  path: string;
  input?: string;
  output?: string;
  params?: Array<{key: string}>
  rtjs?: string
  version?: string
  type: string
}

interface templateConfig {
  prod: string;
  prt: string;
  staging: string;
}

type numOrStr = number | string


export class SidebarContext {
  visible: boolean
  fullscreenParamsEditor: boolean
  fullscrenResultEditor: boolean
  panelVisible: number
  kdev: any
  tg: any
  type: string
  comlibNavVisible: boolean
  isEdit: boolean
  isDebugMode: boolean
  formModel: ServiceConfig
  serviceList: any
  activeId: numOrStr
  toolTipId: numOrStr
  expandId: numOrStr
  isPost: boolean
  isModalVisible: boolean
  settingFormModel: any
  isDebug: boolean
  serviceForm: any
  settingForm: any
  currentClickMenu: string | undefined
  contentType: string
  templateVisible: boolean
  templateModel: templateConfig
  templateForm: any
  leftWidth: number
  editNow: any
  searchValue: string
  addActions: any[]
  connector: { add: any, remove: any, update: any }
  editConnector(def: any) {
    this.editNow = def
  }
  search(val: string) {
    this.searchValue = val;
  }
  addDefaultService: () => void
}

export const defaultResultTransform = `(data) => data`;

// export function ajax(url: string | object, opts?, headers?: any) {
//   if (typeof url === 'object') {
//     opts = url
//   } else {
//     opts = Object.assign({url: url, method: 'get'}, opts)
//   }

//   if (!opts.url) {
//     return Promise.reject(null)
//   }

//   const body = { opts, headers: JSON.parse(headers) }

//   return new Promise((resolve, reject) => {
//     let path = '/app/pcspa/desn/proxy'

//     if (/\.staging\./.test(opts.url)) {
//       path = '/app/pcspa/desn/proxyStaging'
//     }

//     fetch(path, {
//       method: 'post',
//       credentials: 'include',
//       body: JSON.stringify(body)
//     }).then(r => r.json()).then(r => resolve(r)).catch(e => {
//       reject(e)
//     })
//   })
// }

export const ENV = {
  PROD: 'prod',
  PRT: 'prt',
  STAGING: 'staging'
}

export const SERVICE_TYPE = {
  HTTP: 'http',
  TG: 'tg',
  KDEV: 'kdev'
}

export const NO_PANEL_VISIBLE = 0;
export const DEFAULT_PANEL_VISIBLE = 0b01;
export const TG_PANEL_VISIBLE = 0b10;
export const KDEV_PANEL_VISIBLE = 0b100;

export const openApiPrefix = '/api/proxy/openapi';

export const ROOTNAME = 'root';