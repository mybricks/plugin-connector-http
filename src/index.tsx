import Plugin from './plugin';
import { Icon } from './icon';

function pluginEntry(context: any, config = {}) {
  return {
    name: '@mybricks/plugins/service',
    title: '连接器',
    description: '连接器',
    contributes: {
      sliderView: {
        tab: {
          title: '连接器',
          icon: Icon,
          apiSet: ['connector'],
          render(args: any) {
            // @ts-ignore
            return <Plugin context={context} {...config} {...args} />;
          },
        },
      },
    },
  };
}

export default pluginEntry;
