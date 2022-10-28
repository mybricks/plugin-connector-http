import * as service from './service';

function callConnector(connector: any, params: any, config: any) {
  console.log(config, 'config')
  return service.callConnector(connector, params, { ...config });
}

export { callConnector };
