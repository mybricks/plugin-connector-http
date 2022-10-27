import * as service from './service';

function callConnector(connector: any, params: any, config: any) {
  return service.callConnector(connector, params, { ...config });
}

export { callConnector };
