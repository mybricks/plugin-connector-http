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
	envList
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
						  onChange={(code) => {
							  data.config.paramsFn = decodeURIComponent(code);
							  onChange({ paramsFn: code });
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
							  onChange={(code) => {
								  data.config.resultFn = decodeURIComponent(code);
								  onChange({ resultFn: code });
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
				{data.config?.envList?.length ? (
					<div className={curCss.item}>
						<Collapse header="环境配置" defaultFold={false}>
							{data.config.envList.map(env => {
								return (
									<div className={curCss.envItem} key={env.name}>
										<label>{env.title}</label>
										<div className={`${curCss.editor} ${curCss.textEdt}`}>
											<input
												type="text"
												placeholder="请填写环境的请求域名前缀"
												defaultValue={env.defaultApiPrePath}
												onChange={e => {
													env.defaultApiPrePath = e.target.value;
													onChange({ envList: data.config.envList });
												}}
											/>
										</div>
									</div>
								);
							})}
						</Collapse>
					</div>
				) : null}
		  </div>
	  ),
    document.body
  );
}
