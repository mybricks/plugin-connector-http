import Plugin from './plugin';
import { icon } from './icon';
import data from './data';
import {
  exampleParamsFunc,
  PLUGIN_CONNECTOR_NAME,
  resetCDN,
  templateErrorResultFunc,
  templateResultFunc
} from './constant';
import { call } from './runtime/callConnectorHttp';
import { getScript, getDecodeString } from './script';
import { mock } from './script/mock';
// @ts-ignore
import * as Items from './components';
// @ts-ignore
import pkg from '../package.json';
import { getConnectorsByTree } from './utils';

console.log(`%c ${pkg.name} %c@${pkg.version}`, `color:#FFF;background:#fa6400`, ``, ``);

export { call, mock, Items };

export default function pluginEntry(pluginConfig: any = {}) {
  return {
    name: PLUGIN_CONNECTOR_NAME,
    namespace: PLUGIN_CONNECTOR_NAME,
    title: '连接器',
    description: '连接器',
    data,
    onLoad() {
      if (!this.data) {
        return;
      }

      /** 关闭私有化离线模式，使用默认 CDN 链接 */
      if (pluginConfig.isPrivatization === false) {
        resetCDN();
      }

      this.data.connectors?.forEach(con => {
        if (!con.content?.markList?.length) {
          con.content.markList = [{
            title: '默认',
            id: 'default',
            predicate: {},
            outputKeys: con.content.outputKeys || [],
            excludeKeys: con.content.excludeKeys || [],
            outputSchema: con.content.outputSchema || {},
            resultSchema: con.content.resultSchema,
          }];
          delete con.content.outputKeys;
          delete con.content.excludeKeys;
          delete con.content.outputSchema;
          delete con.content.resultSchema;
        }
      });

      /** 初始化全局配置 */
      this.data.config = this.data.config || {
        paramsFn: pluginConfig?.initialValue?.paramsFn || exampleParamsFunc,
        resultFn: pluginConfig?.initialValue?.resultFn || templateResultFunc,
        errorResultFn: pluginConfig?.initialValue?.errorResultFn || templateErrorResultFunc,
      };
      this.data.config.resultFn = this.data.config.resultFn || pluginConfig?.initialValue?.resultFn || templateResultFunc;
      this.data.config.errorResultFn = this.data.config.errorResultFn || pluginConfig?.initialValue?.errorResultFn || templateErrorResultFunc;
    },
    /** 调试时将调用插件的 callConnector 方法 */
    callConnector(connector, params, config) {
      const pureConnectors = { ...this.data, connectors: getConnectorsByTree(this.data.connectors) };

      /** 非连接测试情况，启动 Mock */
      if (connector.mode !== 'test' && (pureConnectors.config.globalMock || config?.openMock)) {
        return mock({ ...connector, ...config });
      }

      /** mode = test，即在编辑面板点击调试 */
      const findConnector = connector.mode === 'test' ? connector : (pureConnectors.connectors.find(con => con.id === connector.id) ?? (connector.script ? connector : null));
      if (findConnector) {
        let curConnector = { ...findConnector };
        /**  支持 json 方式运行 */
        if (!curConnector.script) {
          curConnector = {
            ...curConnector,
            globalParamsFn: pureConnectors.config.paramsFn,
            globalResultFn: pureConnectors.config.resultFn,
            globalErrorResultFn: pureConnectors.config.errorResultFn,
            ...(findConnector.content || {}),
          };
        }

        return call({ useProxy: true, ...connector, ...curConnector }, params, config);
      } else {
        return Promise.reject('接口不存在，请检查连接器插件中接口配置');
      }
    },
    /** 页面导出 JSON 时，会调用插件 toJSON 方法，数据防止在页面 JSON 中 */
    toJSON({ data }) {
      const pureConnectors = { ...data, connectors: getConnectorsByTree(data.connectors) };
      if (!pureConnectors.config) {
        pureConnectors.config = {};
      }

      if (pluginConfig?.pure) {
        try {
          pureConnectors.config.paramsFn = getDecodeString(pureConnectors.config.paramsFn);
          pureConnectors.config.resultFn = getDecodeString(pureConnectors.config.resultFn);
          pureConnectors.config.errorResultFn = getDecodeString(pureConnectors.config.errorResultFn);
          pureConnectors.connectors = pureConnectors.connectors.map(connector => {
            const { type, id, content: { input, output, method, path, markList } } = connector;

            return {
              type,
              id,
              input: getDecodeString(input),
              output: getDecodeString(output),
              method,
              path: path?.trim(),
              globalMock: pureConnectors.config.globalMock,
              markList: markList.map(m => {
                return {
                  id: m.id,
                  title: m.title,
                  predicate: m.predicate,
                  excludeKeys: m.excludeKeys,
                  outputKeys: m.outputKeys,
                };
              }),
            };
          });
        } catch (error) {
          console.log('连接器 toJSON 错误', error);
        }

        return pureConnectors;
      }

      return pureConnectors.connectors.map(con => {
        return {
          id: con.id,
          type: con.type,
          title: con.content.title,
          globalMock: pureConnectors.config.globalMock,
          script: getScript({
            ...con.content,
            globalParamsFn: pureConnectors.config.paramsFn,
            globalResultFn: pureConnectors.config.resultFn,
            globalErrorResultFn: pureConnectors.config.errorResultFn,
          }),
        };
      });
    },
    getConnectorScript(connector) {
      const isTestMode = connector.mode === 'test';
      const curConnector = isTestMode ? connector : getConnectorsByTree(this.data.connectors).find(con => con.id === connector.id);

      try {
        return {
          id: curConnector.id,
          type: curConnector.type,
          title: curConnector.content.title,
          script: getScript({
            isTestMode,
            ...curConnector.content,
            globalParamsFn: this.data.config.paramsFn,
            globalResultFn: this.data.config.resultFn,
            globalErrorResultFn: this.data.config.errorResultFn,
          }),
        };
      } catch (e) {
        throw Error('找不到对应连接器数据');
      }
    },
    contributes: {
      sliderView: {
        tab: {
          title: '连接器',
          icon,
          apiSet: ['connector'],
          render(args: any) {
            // @ts-ignore
            return <Plugin {...pluginConfig} {...args} />;
          },
        },
      },
    },
  };
}

