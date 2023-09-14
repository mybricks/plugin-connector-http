import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '@mybricks/code-editor';
import css from '../../../../src/style-cssModules.less';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import curCss from './index.less';

export default function GlobalPanel({
  closeTemplateForm,
  style,
  data,
  onChange,
}: any) {
	return ReactDOM.createPortal(
	  (
		  <div
			  data-id="plugin-panel"
			  style={{
				  left: 361,
				  ...style,
			  }}
			  className={`${css['sidebar-panel-edit']}`}
		  >
			  <div className={css['sidebar-panel-title']}>
				  <div>全局配置</div>
				  <div>
					  <div className={css['actions']}>
						  <Button size='small' onClick={() => closeTemplateForm()}>
							  关 闭
						  </Button>
					  </div>
				  </div>
			  </div>
			  <div className={curCss.item}>
				  <Collapse header='当开始请求'>
					  <Editor
						  width='100%'
						  height={400}
						  language='javascript'
						  theme='light'
						  lineNumbers='off'
						  /** @ts-ignore */
						  scrollbar={{
							  horizontalScrollbarSize: 2,
							  verticalScrollbarSize: 2,
						  }}
						  value={decodeURIComponent(data.config.paramsFn)}
						  onBlur={e => {
							  if (data.config.paramsFn !== decodeURIComponent(e.target.value)) {
								  data.config.paramsFn = decodeURIComponent(e.target.value);
								  onChange({ paramsFn: e.target.value });
							  }
						  }}
						  env={{
							  isNode: false,
							  isElectronRenderer: false,
						  }}
						  minimap={{ enabled: false }}
					  />
				  </Collapse>
			  </div>
			  {data.config.resultFn ? (
				  <div className={curCss.item}>
					  <Collapse header='当返回响应'>
						  <Editor
							  width='100%'
							  height={400}
							  language='javascript'
							  theme='light'
							  lineNumbers='off'
							  /** @ts-ignore */
							  scrollbar={{
								  horizontalScrollbarSize: 2,
								  verticalScrollbarSize: 2,
							  }}
							  value={decodeURIComponent(data.config.resultFn)}
							  onBlur={e => {
								  if (data.config.resultFn !== decodeURIComponent(e.target.value)) {
									  data.config.resultFn = decodeURIComponent(e.target.value);
									  onChange({ resultFn: e.target.value });
								  }
							  }}
							  env={{
								  isNode: false,
								  isElectronRenderer: false,
							  }}
							  minimap={{ enabled: false }}
						  />
					  </Collapse>
				  </div>
			  ) : null}
		  </div>
	  ),
    document.body
  );
}
