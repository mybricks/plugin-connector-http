import Plugin from './plugin';
import { icon } from './icon';
import data from './data';
import { exampleParamsFunc, PLUGIN_CONNECTOR_NAME, templateResultFunc } from './constant';
import { call } from './runtime/callConnectorHttp';
import { getScript, getDecodeString } from './script';
import { mock } from './script/mock';
// @ts-ignore
import pkg from '../package.json';

console.log(`%c ${pkg.name} %c@${pkg.version}`, `color:#FFF;background:#fa6400`, ``, ``);

export { call, mock };

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

      /** 初始化全局配置 */
      this.data.config = this.data.config || {
        paramsFn: pluginConfig?.initialValue?.paramsFn || exampleParamsFunc,
        resultFn: pluginConfig?.initialValue?.resultFn || templateResultFunc,
      };
      this.data.config.resultFn = this.data.config.resultFn || pluginConfig?.initialValue?.resultFn || templateResultFunc;
    },
    /** 调试时将调用插件的 callConnector 方法 */
    callConnector(connector, params, config) {
      const pureConnectors = { ...this.data };

      /** 非连接测试情况，启动 Mock */
      if (connector.mode !== 'test' && (pureConnectors.config.globalMock || config?.openMock)) {
        return mock({ ...connector, outputSchema: config.mockSchema });
      }

      /** mode = test，即在编辑面板点击调试 */
      const findConnector = connector.mode === 'test' ? connector : pureConnectors.connectors.find(con => con.id === connector.id);
      if (findConnector) {
        let curConnector = { ...findConnector };
        /**  支持 json 方式运行 */
        if (!curConnector.script) {
          curConnector = {
            ...curConnector,
            globalParamsFn: pureConnectors.config.paramsFn,
            globalResultFn: pureConnectors.config.resultFn,
            ...(findConnector.content || {}),
          };
        }

        return call({ useProxy: true, ...connector, ...curConnector }, params, config);
      } else {
        return Promise.reject('找不到对应连接器 Script 执行脚本.');
      }
    },
    /** 页面导出 JSON 时，会调用插件 toJSON 方法，数据防止在页面 JSON 中 */
    toJSON({ data }) {
      const pureConnectors = { ...data };

      if (pluginConfig?.pure) {
        try {
          pureConnectors.config.paramsFn = getDecodeString(pureConnectors.config.paramsFn);
          pureConnectors.config.resultFn = getDecodeString(pureConnectors.config.resultFn);
          pureConnectors.connectors = pureConnectors.connectors.map(connector => {
            const { type, id, content: { input, output, method, path, excludeKeys, outputKeys } } = connector;

            return {
              type,
              id,
              input: getDecodeString(input),
              output: getDecodeString(output),
              method,
              path: path?.trim(),
              excludeKeys,
              outputKeys
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
          script: getScript({
            ...con.content,
            globalParamsFn: pureConnectors.config.paramsFn,
            globalResultFn: pureConnectors.config.resultFn,
          }),
        };
      });
    },
    getConnectorScript(connector) {
      const curConnector = this.data.connectors.find(con => con.id === connector.id);

      if (curConnector) {
        return {
          id: curConnector.id,
          type: curConnector.type,
          title: curConnector.content.title,
          script: getScript({
            ...curConnector.content,
            globalParamsFn: this.data.config.paramsFn,
            globalResultFn: this.data.config.resultFn,
          }),
        };
      } else {
        throw Error('找不到对应连接器数据');
      }
    },
    contributes: {
      sliderView: {
        tab: {
          title: '连接器',
          icon: icon,
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

