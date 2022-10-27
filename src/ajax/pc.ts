import * as service from './service';
import axios from 'axios';
import { stringify } from 'qs';

const { ENV } = service;

axios.defaults.paramsSerializer = {
  serialize: (params: any) =>
    stringify(params, {
      arrayFormat: 'brackets',
      filter: (key: string, data: any) => {
        if (data && data._isAMomentObject) {
          return data._d.valueOf();
        }
        return data;
      },
      // @ts-ignore
      serializeDate: (date: Date) => {
        return date.getTime();
      },
    }),
};

function serviceAgent(id: any, params: any, config: any) {
  return service.serviceAgent(id, params, { agent: axios, ...config });
}

function ajaxMethod(url: string, params: any, config: any) {
  return service.ajaxMethod(url, params, { agent: axios, ...config });
}

function callConnector(connector: any, params: any, config: any) {
  return service.callConnector(connector, params, { agent: axios, ...config });
}

export { ajaxMethod, serviceAgent, ENV, callConnector };
