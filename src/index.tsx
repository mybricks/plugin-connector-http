import Plugin from './plugin';
import { icon } from './icon';
import data from './data';
import GlobalContext, { getConnectors, getPureConnectors } from './context';
import { exampleParamsFunc, PLUGIN_CONNECTOR_NAME, templateResultFunc } from './constant';
import { call } from './runtime/callConnectorHttp';
import { getScript } from './script';
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
    onLoad: ({ data }) => {
      if (!data) {
        return;
      }

      /** 初始化全局配置 */
      data.config = data.config || {
        paramsFn: pluginConfig?.initialValue?.paramsFn || exampleParamsFunc,
        resultFn: pluginConfig?.initialValue?.resultFn || templateResultFunc,
      };
      data.config.resultFn = data.config.resultFn || pluginConfig?.initialValue?.resultFn || templateResultFunc;

      /** 初始化 envList */
      if (pluginConfig?.envList?.length && data?.config) {
        data.config.envList = pluginConfig.envList.map(env => {
          const find = data.config.envList?.find(e => e.name === env.name);

          if (find) {
            return { ...env, defaultApiPrePath: find.defaultApiPrePath };
          } else {
            return { ...env };
          }
        });
      }

      GlobalContext.initPureConnectors(data);
      /** 初始化插件内连接器 script 数据 */
      GlobalContext.init(data.connectors.map(con => {
        return {
          id: con.id,
          type: con.type,
          title: con.content.title,
          script: getScript({
            ...con.content,
            globalParamsFn: data.config.paramsFn,
            globalResultFn: data.config.resultFn,
            envList: data.config.envList,
          }),
        };
      }));
    },
    /** 调试时将调用插件的 callConnector 方法 */
    callConnector: (connector, params, config) => {
      /** 启动 Mock */
      if (config?.openMock) {
        return mock({ ...connector, outputSchema: config.mockSchema });
      }

      /** mode = test，即在编辑面板点击调试 */
      const curConnector = connector.mode === 'test' ? connector : getConnectors().find(con => con.id === connector.id);
      if (curConnector) {
        return call({ ...connector, ...curConnector, useProxy: true }, params, config);
      } else {
        return Promise.reject('找不到对应连接器 Script 执行脚本.');
      }
    },
    /** 页面导出 JSON 时，会调用插件 toJSON 方法，数据防止在页面 JSON 中 */
    toJSON: () => {
      if (pluginConfig?.pure) {
        const pureConnectors = { ...getPureConnectors() };

        try {
          pureConnectors.connectors = pureConnectors.connectors.map(connector => {
            const { type, id, content: { input, output, method, path, excludeKeys, outputKeys } } = connector;

            return { type, id, input, output, method, path, excludeKeys, outputKeys };
          });
        } catch (error) {
          console.log('连接器 toJSON 错误', error);
        }

        return pureConnectors;
      }

      return getConnectors();
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

