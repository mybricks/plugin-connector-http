import axios from 'axios';
interface IOptions {
  method: string;
  url: string;
  data: any;
  params: any;
  headers: any;
  [key: string]: any;
}

interface IConfig {
  before: (options: IOptions) => any;
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
      const fn = eval(`(${decodeURIComponent(connector.script)})`);
      const { before = defaultFn } = config || {};
      fn(
        params,
        { then: resolve, onError: reject },
        {
          executeEnv: connector.executeEnv,
          ajax(options: IOptions) {
            const opts = before({ ...options });
            const { url } = opts;

            if (!url) {
              reject('请求路径不能为空');
            }

            if (connector.useProxy && httpRegExp.test(url) && url.match(/^https?:\/\/([^/#&?])+/g)?.[0] !== location.origin) {
              return axios({url: '/paas/api/proxy', method: 'post', data: opts || options}).then((res: any) => res.data).catch(error => {
                reject(error)
              })
            }

            return axios(opts || options).then((res: any) => res.data).catch(error => {
              reject(error)
            })
          },
        }
      );
    } catch (ex) {
      console.log('连接器错误', ex);
      reject(`连接器script错误.`);
    }
  });
}