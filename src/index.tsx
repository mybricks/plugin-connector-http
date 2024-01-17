import { icon } from "./icon";
import Plugin from './plugin/index'
export default function pluginEntry(param = {}) {
  return {
    name: '@mybricks/plugins/ai-copilot',
    title: 'AI',
    description: 'AI Copilot',
    contributes: {
      sliderView: {
        tab: {
          title: 'AI Copilot',
          apiSet: ['command'],
          icon: (
            icon
          ),
          render(args: any) {
            // return <SwaggerPlugin designer={designer} fileId={fileId} projectId={projectId} />;
            // console.log('---',args)
            return <Plugin {...args} { ...param }></Plugin>
          },
        },
      },
    },
  };
};