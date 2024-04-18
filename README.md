# Mybricks插件-连接器-http
## 简介
用于连接端到端的http接口，支持get、post、put、delete等请求。

## 如何使用
插件使用需结合 Mybricks 设计器引擎，配置如下
```typescript jsx
import servicePlugin from '@mybricks/plugin-connector-http';

// 设计器配置
const appConfig = {
  plugins: [
    servicePlugin({
      /** 
       * 非必填，私有化开关
       * 默认开启私有化（即代表内部所需资源会走相对路径，需配套 aPaas 平台使用）
       * false 关闭私有化（即代表内部所需资源使用 CDN）
       */
      isPrivatization: false,
      // 非必填，扩展接口类型，默认带 http 类型接口编辑面板
      addActions: [
        {
          // 接口类型
          type: 'http-sql',
          // 接口类型名称
          title: '领域接口',
          // 是否需要使用连接器内部的编辑接口的面板
          noUseInnerEdit: true,
          // 扩展的接口类型的编辑面板
          render: (props) => {
            // 扩展的接口类型的渲染
            return (<div />);
          }
        },
      ],
      /**
        * 非必填，纯 JSON 模式开关
        * 默认 false ，即页面发布时会生成完整的接口运行 script，此模式包体积会大
        * true 开启，即页面发布会导出完整的接口描述（非 script），此模式能减少包体积
        */
      pure: true,
    }),
    // 其余插件配置，如 工具插件
    toolsPlugin(),
  ],
  com: {
    env: {
      // 配合连接器声明的调用方法
      callConnector(connector, params, connectorConfig = {}) {
        const plugin = designerRef.current?.getPlugin(connector.connectorName);
        if (plugin) {
          // 发送请求
          return plugin.callConnector(connector, params, {
            ...connectorConfig,
            before: options => {
              // 接口发起请求前的钩子，可处理请求参数、header 等
              return options;
            }
          });
        } else {
          return Promise.reject('错误的连接器类型.');
        }
      },
    }
  }
};
```