import * as Icons from "./Icons";
import dataClz from './Data'

import SliderView from "./sliderview/MainView";

export default {
  name: "@mybricks/plugins",
  title: "连接器",
  description: "连接器插件",
  data: dataClz,
  contributes: {
    sliderView: {
      tab: {
        title: "编辑连接器",
        icon: Icons.icon,
        apiSet: ['connector'],
        render(args) {
          return <SliderView {...args}/>
        }
      }
    }
  }
}
