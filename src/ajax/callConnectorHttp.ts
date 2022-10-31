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
  beforeSend: (options: IOptions) => any;
}

const defaultFn = (options: IOptions, ...args: any) => ({ ...options, ...args });

export function callConnectorHttp(
  script: string,
  params: any,
  config?: IConfig
) {
  return new Promise((resolve, reject) => {
    try {
      const fn = eval(`(${decodeURIComponent(script)})`);
      const { beforeSend = defaultFn } = config || {};
      fn(
        params,
        { then: resolve, onError: reject },
        {
          ajax(options: IOptions) {
            const opts = beforeSend({ ...options });
            return axios(opts || options).then((res: any) => res.data);
          },
        }
      );
    } catch (ex) {
      reject(`连接器script错误.`);
    }
  });
}
