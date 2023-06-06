import Plugin from './plugin';
import { icon } from './icon';
import data from './data';
// @ts-ignore
import pkg from '../package.json';

console.log(`%c ${pkg.name} %c@${pkg.version}`, `color:#FFF;background:#fa6400`, ``, ``);

export { call, mock } from './runtime/callConnectorHttp'

export default function pluginEntry(config?: any) {
  return {
    name: '@mybricks/plugins/service',
    title: '连接器',
    description: '连接器',
    data,
    contributes: {
      sliderView: {
        tab: {
          title: '连接器',
          icon: icon,
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

