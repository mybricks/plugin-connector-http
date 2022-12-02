import axios from 'axios';
import { schema2data } from '../utils';
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

export function call(
  connector: { id: string; script: string; [key: string]: any },
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
          ajax(options: IOptions) {
            const opts = before({ ...options });
            return axios(opts || options).then((res: any) => res.data).catch(error => {
              reject(error)
            })
          },
        }
      );
    } catch (ex) {
      reject(`连接器script错误.`);
    }
  });
}

export function mock(
  connector: { id: string; script: string; [key: string]: any },
) {
  return new Promise((resolve, reject) => {
    if (connector.type === 'http') {
      try {
        if (connector.outputSchema) {
          // use mock data
          return resolve(schema2data(connector.outputSchema))
        } else {
          reject(`connector has no outputSchema`)
        }
      } catch (ex) {
        reject(`connecotr mock error.`);
      }
    } else {
      reject(`error connecotr type`);
    }
  });
}