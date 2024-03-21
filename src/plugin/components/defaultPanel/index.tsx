import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DebugForm, { Model } from '../debug';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import { safeDecode, uuid } from '../../../utils';
import { CDN } from '../../../constant';
import { debounce } from '../../../utils/lodash';
import { NameInput, AddressInput, MethodRadio, DocInput, DescriptionInput, EditorWithFullScreen } from '../../../components'
import { notice } from '../../../components';
import PanelWrap, { PanelWrapRef } from '../../../components/panel';

/** type 由各自类型指定 */
const getDefaultModel = () => {
	return { path: '', title: '', method: 'POST', id: uuid(), type: 'http', input: '', output: '' };
};
export default function DefaultPanel({ sidebarContext, style, onSubmit, setRender }: any) {
	const panelRef = useRef<PanelWrapRef>();
	const [model, setModel] = useState<Record<string, any>>(sidebarContext.formModel || getDefaultModel());
	/** 错误字段 */
	const [errorFields, setErrorFields] = useState([]);
	const onClosePanel = useCallback(() => {
		sidebarContext.type = '';
		sidebarContext.activeId = void 0;
		sidebarContext.isEdit = false;
		setRender(sidebarContext);
	}, []);

	const validate = () => {
		let error = '';
		if (model.path) {
			setErrorFields([])
		} else {
			let arr = ['path']
			setErrorFields(arr)
			error = '接口的请求路径不能为空';
		}

		if (!model.markList?.length) {
			error = '数据标记组必须存在';
			notice(error);
		} else {
			const markList = model.markList;
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
		sidebarContext.formModel = model;
		onSubmit();
	};

	useEffect(() => {
		model.path && setErrorFields([]);
	}, [model.path]);

	const addressError = useMemo(() => {
		return errorFields.length && errorFields.includes('path') ? '请填写完整的地址' : ''
	}, [errorFields]);


	
  const editorPath = useMemo(() => {
    let random = `file:///${Math.random()}_code`;
    return random;
  }, []);

	return (
		<PanelWrap
			ref={panelRef}
			style={style}
			title={model?.title}
			extra={<Button type="primary" size="small" onClick={onSaveClick}>保 存</Button>}
			onClose={onClosePanel}
		>
			<Collapse header="基本信息" defaultFold={false}>
				<NameInput
					defaultValue={model.title}
					onChange={e => setModel(model => ({ ...model, title: e.target.value }))}
				/>
				<AddressInput
					defaultValue={model.path}
					onChange={e => setModel(model => ({ ...model, path: e.target.value }))}
					validateError={addressError}
				/>
				<MethodRadio
					defaultValue={model.method}
					onChange={method => setModel(model => ({ ...model, method }))}
				/>
			</Collapse>
			<Collapse header="当开始请求">
				<EditorWithFullScreen
					unique={'request'}
					CDN={CDN}
					path={editorPath + 'request.js'}
					onChange={debounce((code: string) => {
						setModel(model => ({ ...model, input: encodeURIComponent(code) }))
					}, 200)}
					value={safeDecode(model.input)}
				/>
			</Collapse>
			<Collapse header="当返回响应">
				<EditorWithFullScreen
					unique={'response'}
					CDN={CDN}
					path={editorPath + 'response.js'}
					onChange={debounce((code: string) => {
						setModel(model => ({ ...model, output: encodeURIComponent(code) }))
					}, 200)}
					value={safeDecode(model.output)}
				/>
			</Collapse>
			<Collapse header="其他信息">
				<DescriptionInput
					defaultValue={model.desc}
					onBlur={(e) => setModel(model => ({ ...model, desc: e.target.value }))}
				/>
				<DocInput
					onBlur={(e) => setModel(model => ({ ...model, doc: e.target.value }))}
					defaultValue={model.doc}
				/>
			</Collapse>
			<Collapse header="接口调试" defaultFold={false}>
				<DebugForm
					model={model as Model}
					connect={sidebarContext.connector.test}
					onChangeModel={setModel}
					registerBlur={panelRef.current?.registerBlur}
				/>
			</Collapse>
		</PanelWrap>
	);
}
