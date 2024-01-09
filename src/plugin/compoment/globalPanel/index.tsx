import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '@mybricks/code-editor';
import css from '../../../../src/style-cssModules.less';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import { CDN, templateErrorResultFunc } from '../../../constant';
import { debounce } from '../../../utils/lodash';
import curCss from './index.less';

export default function GlobalPanel({
  closeTemplateForm,
  style,
  data,
}: any) {
	return ReactDOM.createPortal(
	  (
		  <div data-id="plugin-panel" style={{ left: 361, ...style }} className={css['sidebar-panel-edit']}>
			  <div className={css['sidebar-panel-title']}>
				  <div>全局配置</div>
				  <div>
					  <div className={css['actions']}>
						  <Button size="small" onClick={() => closeTemplateForm()}>
							  关 闭
						  </Button>
					  </div>
				  </div>
			  </div>
			  <div className={curCss.item}>
				  <Collapse header="当开始请求">
					  <Editor
						  width="100%"
						  height={400}
						  language="javascript"
						  theme="light"
						  lineNumbers="on"
						  CDN={CDN}
						  scrollbar={{ horizontalScrollbarSize: 2, verticalScrollbarSize: 2 }}
						  value={decodeURIComponent(data.config.paramsFn)}
							onChange={debounce((code: string) => {
								if (data.config.paramsFn !== code) {
									data.config.paramsFn = code;
								}
							}, 100)}
						  env={{ isNode: false, isElectronRenderer: false }}
						  minimap={{ enabled: false }}
					  />
				  </Collapse>
			  </div>
			  {data.config.resultFn ? (
				  <div className={curCss.item}>
					  <Collapse header="当返回响应">
						  <Editor
							  width="100%"
							  height={400}
							  language="javascript"
							  theme="light"
							  lineNumbers="on"
							  CDN={CDN}
							  scrollbar={{ horizontalScrollbarSize: 2, verticalScrollbarSize: 2 }}
							  value={decodeURIComponent(data.config.resultFn)}
								onChange={debounce((code: string) => {
									if (data.config.resultFn !== code) {
									  data.config.resultFn = code;
								  }
								}, 100)}
							  env={{ isNode: false, isElectronRenderer: false }}
							  minimap={{ enabled: false }}
						  />
					  </Collapse>
				  </div>
			  ) : null}
			  <div className={curCss.item}>
				  <Collapse header="当接口响应错误时">
					  <Editor
						  width="100%"
						  height={400}
						  language="javascript"
						  theme="light"
						  lineNumbers="on"
						  CDN={CDN}
						  scrollbar={{ horizontalScrollbarSize: 2, verticalScrollbarSize: 2 }}
						  value={decodeURIComponent(data.config.errorResultFn || templateErrorResultFunc)}
						  onChange={debounce((code: string) => {
							  if (data.config.errorResultFn !== code) {
								  data.config.errorResultFn = code;
							  }
						  }, 100)}
						  env={{ isNode: false, isElectronRenderer: false }}
						  minimap={{ enabled: false }}
					  />
				  </Collapse>
			  </div>
		  </div>
	  ),
    document.body
  );
}
