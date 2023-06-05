import React, {CSSProperties, FC, useCallback} from 'react';
import ReactDOM from 'react-dom';
import Button from '../../../components/Button';
import {AGGREGATION_MODEL_VISIBLE, NO_PANEL_VISIBLE} from '../../../constant';

import styles from './index.less';

interface AggregationModelProps {
	style: CSSProperties;
	setRender(value: Record<string, unknown>): void;
	sidebarContext: any;
	updateService(action: string, entity: any): void;
	data: any;
}

const AggregationModel: FC<AggregationModelProps> = props => {
	const { sidebarContext, style, setRender } = props;
	
	const onSave = useCallback(() => {
		sidebarContext.panelVisible = NO_PANEL_VISIBLE;
		setRender(sidebarContext);
	}, [sidebarContext]);
	
  return ReactDOM.createPortal(
	  sidebarContext.panelVisible & AGGREGATION_MODEL_VISIBLE ? (
		  <div className={styles.sidebarPanelEdit} data-id="plugin-panel" style={{ ...style, left: 361 }}>
			  <div className={styles.sidebarPanelTitle}>
				  <div>聚合模型</div>
				  <div>
					  <div>
						  <Button size='small' type="primary"  onClick={onSave}>
							  保 存
						  </Button>
					  </div>
				  </div>
			  </div>
		  </div>
	  ) : null,
	  document.body
  );
};

export default AggregationModel;
