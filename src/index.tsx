import Plugin from './plugin';
import { Icon } from './icon';
import data from './data';

function pluginEntry(config?: any) {
  return {
    name: '@mybricks/plugins/service',
    title: '连接器',
    description: '连接器',
    data,
    contributes: {
      sliderView: {
        tab: {
          title: '连接器',
          icon: Icon,
          apiSet: ['connector'],
          render(args: any) {
            // @ts-ignore
            return <Plugin {...config} {...args} />;
          },
        },
      },
    },
  };
}

export default pluginEntry;
