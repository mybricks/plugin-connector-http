import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import DebugForm from '../debug';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import { safeDecode } from '../../../utils';
import { CDN } from '../../../constant';
import { DefaultPanelContext } from './context';
import { debounce } from '../../../utils/lodash';
import { NameInput, AddressInput, MethodRadio, DocInput, DescriptionInput, EditorWithFullScreen } from '../../../components/PanelItems'
import { notice } from '../../../components/Message';

import parentCss from '../../../style-cssModules.less';
import css from './index.less';

export default function DefaultPanel({
	sidebarContext,
	style,
	onSubmit,
	setRender,
	globalConfig,
}: any) {
	const blurMapRef = useRef<any>({});
	const [paramsFn, setParamsFn] = useState<string>(sidebarContext.formModel.input);
	const [outputFn, setOutputFn] = useState<string>(sidebarContext.formModel.output);
	const [, forceUpdate] = useState(0);

	/** 错误字段 */
	const [errorFields, setErrorFields] = useState([])
	const onClosePanel = useCallback(() => {
		sidebarContext.type = '';
		sidebarContext.isDebug = false;
		sidebarContext.activeId = void 0;
		sidebarContext.isEdit = false;
		setRender(sidebarContext);
	}, []);


	const validatePath = () => {
		if (sidebarContext.formModel.path) {
			setErrorFields([])
			return true;
		}
		let arr = ['path']
		setErrorFields(arr)
		return false;
	};

	const validate = () => {
		let error = '';
		if (sidebarContext.formModel.path) {
			setErrorFields([])
		} else {
			let arr = ['path']
			setErrorFields(arr)
			error = '接口的请求路径不能为空';
		}

		if (!sidebarContext.formModel.markList?.length) {
			error = '数据标记组必须存在';
			notice(error);
		} else {
			const markList = sidebarContext.formModel.markList;
			const defaultMark = markList.find(m => m.id === 'default');

			if (!defaultMark) {
				error = '数据标记组中【默认】组必须存在';
				notice(error);
			} else if (markList.length > 1) {
				const errorMark = markList.find(m => !m.predicate || !m.predicate.key || (m.predicate.value === undefined || m.predicate.value === ''));

				if (errorMark) {
					error = `数据标记组中【${errorMark.title}】组的生效标识不存在或标识值为空`;
					notice(error);
				}
			}
		}

		return !error;
	};

	const onSaveClick = () => {
		if (!validate()) return;
		onSubmit();
	};

	const onBlurAll = () => {
		Object.values(blurMapRef.current).forEach((blur: any) => blur?.());
	};

	useEffect(() => {
		setParamsFn(sidebarContext.formModel.input);
	}, [sidebarContext.formModel.input]);

	useEffect(() => {
		setOutputFn(sidebarContext.formModel.output);
	}, [sidebarContext.formModel.output]);

	useEffect(() => {
		if (sidebarContext.formModel.path) {
			setErrorFields([])
		}
	}, [sidebarContext.formModel.path]);
	const contextValue = useMemo(() => {
		return { addBlurAry: (key, blur) => (blurMapRef.current = { ...blurMapRef.current, [key]: blur }) };
	}, []);

	const addressError = useMemo(() => {
		return errorFields.length && errorFields.includes('path') ? '请填写完整的地址' : ''
	}, [errorFields])

	return ReactDOM.createPortal(
		(
			<div
				data-id="plugin-panel"
				style={{ left: 361, ...style }}
				className={`${parentCss['sidebar-panel-edit']}`}
				onClick={onBlurAll}
			>
				<DefaultPanelContext.Provider value={contextValue}>
					<div className={parentCss['sidebar-panel-title']}>
						<div>{sidebarContext.formModel?.title}</div>
						<div>
							<div className={parentCss['actions']}>
								{!sidebarContext.isEidt && (
									<Button type='primary' size='small' onClick={onSaveClick}>
										保 存
									</Button>
								)}
								<Button size='small' onClick={() => onClosePanel()}>
									关 闭
								</Button>
							</div>
						</div>
					</div>
					<div className={parentCss['sidebar-panel-content']}>
						<>
							<div className={css.ct}>
								<Collapse header="基本信息" defaultFold={false}>
									<NameInput
										/** 防止 Collapse 面板折叠后 UI 展示数据丢失 */
										onBlur={() => forceUpdate(Math.random())}
										key={sidebarContext.formModel.title + 'name'}
										defaultValue={sidebarContext.formModel.title}
										onChange={(e) => {
											sidebarContext.titleErr = void 0;
											sidebarContext.formModel.title = e.target.value;
										}}
									/>
									<AddressInput
										defaultValue={sidebarContext.formModel.path}
										key={sidebarContext.formModel.path + 'path'}
										/** 防止 Collapse 面板折叠后 UI 展示数据丢失 */
										onBlur={() => forceUpdate(Math.random())}
										onChange={(e) => {
											sidebarContext.formModel.path = e.target.value;
										}}
										validateError={addressError}
									/>
									<MethodRadio
										defaultValue={sidebarContext.formModel.method}
										onChange={(value) => {
											sidebarContext.formModel.method = value;
										}}
									/>
								</Collapse>
							</div>
							<div className={css.ct}>
								<Collapse header='当开始请求'>
									<EditorWithFullScreen
										key={sidebarContext.formModel.id}
										CDN={CDN}
										onChange={debounce((code: string) => {
											sidebarContext.formModel.input = encodeURIComponent(code);
											setParamsFn(code);
										}, 200)}
										value={safeDecode(paramsFn)}
									/>
								</Collapse>
							</div>
							<div className={css.ct}>
								<Collapse header='当返回响应'>
									<EditorWithFullScreen
										key={sidebarContext.formModel.id}
										CDN={CDN}
										onChange={debounce((code: string) => {
											sidebarContext.formModel.output = encodeURIComponent(code);
											setOutputFn(encodeURIComponent(code));
										}, 200)}
										value={safeDecode(outputFn)}
									/>
								</Collapse>
							</div>
							<div className={css.ct}>
								<Collapse header='其他信息'>
									<DescriptionInput
										defaultValue={sidebarContext.formModel.desc}
										onBlur={(e) => {
											sidebarContext.formModel.desc = e.target.value;
											// setRender(sidebarContext);
										}}
										key={sidebarContext.formModel.desc + 'desc'}
									/>
									<DocInput
										onBlur={(e) => {
											sidebarContext.formModel.doc = e.target.value;
											setRender(sidebarContext);
										}}
										key={sidebarContext.formModel.doc + 'doc'}
										defaultValue={sidebarContext.formModel.doc}
									/>
								</Collapse>
							</div>
						</>
						<div className={css.ct}>
							<Collapse header='接口调试' defaultFold={false}>
								<DebugForm
									sidebarContext={sidebarContext}
									setRender={setRender}
									validate={validatePath}
									globalConfig={globalConfig}
								/>
							</Collapse>
						</div>
					</div>
				</DefaultPanelContext.Provider>
			</div>
		),
		document.body
	);
}
