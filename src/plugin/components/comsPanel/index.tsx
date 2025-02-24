import React, { CSSProperties, FC } from 'react';
import PanelWrap from '../../../components/panel';

import css from "./index.less";

interface ComsPanelProps {
	onClose(): void;
	style: CSSProperties;
	onSubmit(value: any): void;
  model: {
    coms: any[];
    connector: any;
  }
}

const ComsPanel: FC<ComsPanelProps> = ({ onClose, style, onSubmit, model }) => {

	return (
		<PanelWrap
      style={style}
      title={"添加组件"}
      onClose={onClose}
      className={css.container}
    >
      {model.coms.length ? (
        <div className={css.comsList}>
          {model.coms.map((com) => {
            return (
              <div className={css.comItem} data-mybricks-tip={com.title} onClick={() => onSubmit({ com, connector: model.connector })}>
                <div className={css.comIcon}>
                  <img className={css.comImg} src={com.icon} />
                </div>
                <div className={css.comTitle}>
                  {com.title}
                </div>
              </div>
            )
          })}
        </div>
      ): (
        <div>
          未匹配到对应schema的组件
        </div>
      )}
		</PanelWrap>
	);
};
export default ComsPanel
