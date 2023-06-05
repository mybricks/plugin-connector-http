import React, {CSSProperties, FC, useCallback, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import Editor from '@mybricks/code-editor';
import Button from '../../../components/Button';
import {AGGREGATION_MODEL_VISIBLE, NO_PANEL_VISIBLE} from '../../../constant';
import Collapse from '../../../components/Collapse';
import RadioBtns from '../defaultPanel/RadioBtn';
import {fullScreen, fullScreenExit} from '../../../icon';
import {safeDecode} from '../../../utils';
import FormItem from '../../../components/FormItem';
import Input, {TextArea} from '../../../components/Input';

import styles from './index.less';
import css from '../defaultPanel/index.less';
import parentCss from '../../../style-cssModules.less';

interface AggregationModelProps {
	style: CSSProperties;
	setRender(value: Record<string, unknown>): void;
	sidebarContext: any;
	updateService(action: string, entity: any): void;
	data: any;
}
const tabList = [
	{
		name: '查询',
		key: 'select'
	},
	{
		name: '删除',
		key: 'delete'
	}
];
const methodOpts = [
	{ title: 'GET', value: 'GET' },
	{ title: 'POST', value: 'POST' },
	{ title: 'PUT', value: 'PUT' },
	{ title: 'DELETE', value: 'DELETE' },
];

const AggregationModel: FC<AggregationModelProps> = props => {
	const { sidebarContext, style, setRender } = props;
	const [activeTab, setActiveTab] = useState('select');
	const [paramsFn, setParamsFn] = useState<string>(sidebarContext.formModel.input);
	const [outputFn, setOutputFn] = useState<string>(sidebarContext.formModel.output);
	const addressRef = useRef<any>();
	const paramRef = useRef<HTMLDivElement>();
	const resultRef = useRef<HTMLDivElement>();
	
	const onSave = useCallback(() => {
		sidebarContext.panelVisible = NO_PANEL_VISIBLE;
		setRender(sidebarContext);
	}, [sidebarContext]);
	
	const onParamsEditorFullscreen = () => {
		paramRef.current?.classList.add(parentCss['sidebar-panel-code-full']);
		sidebarContext.fullscreenParamsEditor = true;
		setRender(sidebarContext);
	};
	
	const onParamsEditorFullscreenExit = () => {
		paramRef.current?.classList.remove(parentCss['sidebar-panel-code-full']);
		sidebarContext.fullscreenParamsEditor = false;
		setRender(sidebarContext);
	};
	const onResultEditorFullscreen = () => {
		sidebarContext.fullscrenResultEditor = true;
		resultRef.current?.classList.add(parentCss['sidebar-panel-code-full']);
		setRender(sidebarContext);
	};
	const onResultEditorFullscreenExit = () => {
		sidebarContext.fullscrenResultEditor = false;
		resultRef.current?.classList.remove(parentCss['sidebar-panel-code-full']);
		setRender(sidebarContext);
	};
	
  return ReactDOM.createPortal(
	  sidebarContext.panelVisible & AGGREGATION_MODEL_VISIBLE ? (
		  <div className={styles.sidebarPanelEdit} data-id="plugin-panel" style={{ ...style, left: 361 }}>
			  <div className={styles.sidebarPanelTitle}>
				  <div>聚合模型</div>
				  <div>
					  <Button size='small' type="primary"  onClick={onSave}>
						  保 存
					  </Button>
				  </div>
			  </div>
			  <div className={styles.tabs}>
				  {tabList.map(tab => {
						return (
							<div
								key={tab.key}
								className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
								onClick={() => setActiveTab(tab.key)}
							>
								{tab.name}
							</div>
						);
				  })}
			  </div>
			  {activeTab === 'select' ? (
					<>
						<div className={css.ct}>
							<Collapse header='基本信息' defaultFold={false}>
								<div className={css.item}>
									<label>名称</label>
									<div
										className={`${css.editor} ${css.textEdt} ${
											sidebarContext.titleErr ? css.error : ''
										}`}
										data-err={sidebarContext.titleErr}
									>
										<input
											type={'text'}
											placeholder={'服务接口的标题'}
											defaultValue={sidebarContext.formModel.title}
											key={sidebarContext.formModel.title}
											onChange={(e) => {
												sidebarContext.titleErr = void 0;
												sidebarContext.formModel.title = e.target.value;
											}}
										/>
									</div>
								</div>
								<div className={css.item}>
									<label>
										<i>*</i>地址
									</label>
									<div
										ref={addressRef}
										className={`${css.editor} ${css.textEdt}`}
										data-err='请填写完整的地址'
									>
                    <textarea
	                    defaultValue={sidebarContext.formModel.path}
	                    key={sidebarContext.formModel.path}
	                    placeholder={'接口的请求路径'}
	                    onChange={(e) => {
		                    sidebarContext.formModel.path = e.target.value;
		                    if (sidebarContext.formModel.path) {
			                    addressRef.current?.classList.remove(css.error);
		                    }
	                    }}
                    />
									</div>
								</div>
								<div></div>
								<div className={css.item}>
									<label>
										<i>*</i>请求方法
									</label>
									<div className={css.editor}>
										<RadioBtns
											binding={[sidebarContext.formModel, 'method']}
											options={methodOpts}
										/>
									</div>
								</div>
							</Collapse>
						</div>
						<div className={css.ct}>
							<Collapse header='当开始请求'>
								{sidebarContext.fullscreenParamsEditor ? (
									<div
										onClick={onParamsEditorFullscreenExit}
										className={parentCss['sidebar-panel-code-icon-full']}
									>
										{fullScreenExit}
									</div>
								) : (
									<div
										onClick={onParamsEditorFullscreen}
										className={parentCss['sidebar-panel-code-icon']}
									>
										{fullScreen}
									</div>
								)}
								<Editor
									onMounted={(editor, monaco, container: HTMLDivElement) => {
										paramRef.current = container;
										container.onclick = (e) => {
											if (e.target === container) {
												onParamsEditorFullscreenExit();
											}
										};
									}}
									env={{
										isNode: false,
										isElectronRenderer: false,
									}}
									onChange={(code: string) => {
										sidebarContext.formModel.input = encodeURIComponent(code);
										setParamsFn(code);
									}}
									value={safeDecode(paramsFn)}
									width='100%'
									height='100%'
									minHeight={300}
									language='javascript'
									theme='light'
									lineNumbers='off'
									scrollbar={{
										horizontalScrollbarSize: 2,
										verticalScrollbarSize: 2,
									}}
									minimap={{ enabled: false }}
								/>
							</Collapse>
						</div>
						<div className={css.ct}>
							<Collapse header='当返回响应'>
								{sidebarContext.fullscrenResultEditor ? (
									<div
										onClick={onResultEditorFullscreenExit}
										className={parentCss['sidebar-panel-code-icon-full']}
									>
										{fullScreen}
									</div>
								) : (
									<div
										onClick={onResultEditorFullscreen}
										className={parentCss['sidebar-panel-code-icon']}
									>
										{fullScreen}
									</div>
								)}
								<Editor
									onMounted={(editor, monaco, container: HTMLDivElement) => {
										resultRef.current = container;
										container.onclick = (e) => {
											if (e.target === container) {
												onResultEditorFullscreenExit();
											}
										};
									}}
									env={{
										isNode: false,
										isElectronRenderer: false,
									}}
									onChange={(code: string) => {
										sidebarContext.formModel.output = encodeURIComponent(code);
										setOutputFn(encodeURIComponent(code));
									}}
									value={safeDecode(outputFn)}
									width='100%'
									height='100%'
									minHeight={300}
									language='javascript'
									theme='light'
									lineNumbers='off'
									scrollbar={{
										horizontalScrollbarSize: 2,
										verticalScrollbarSize: 2,
									}}
									minimap={{ enabled: false }}
								/>
							</Collapse>
						</div>
						<div className={css.ct}>
							<Collapse header='其他信息'>
								<FormItem label='接口描述'>
									<Input
										defaultValue={sidebarContext.formModel.desc}
										onBlur={(e) => {
											sidebarContext.formModel.desc = e.target.value;
											// setRender(sidebarContext);
										}}
									/>
								</FormItem>
								<FormItem label='文档链接'>
									<TextArea
										style={{ height: 80 }}
										onBlur={(e) => {
											sidebarContext.formModel.doc = e.target.value;
											setRender(sidebarContext);
										}}
										defaultValue={sidebarContext.formModel.doc}
									/>
								</FormItem>
							</Collapse>
						</div>
					</>
			  ) : null}
		  </div>
	  ) : null,
	  document.body
  );
};

export default AggregationModel;
