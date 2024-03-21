import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	extractParamsAndSchemaByJSON,
	extractParamsBySchema,
	formatSchema,
	getDataByExcludeKeys,
	getDataByOutputKeys,
	hasFile,
	jsonToSchema,
	params2data,
	paramsToSchema,
	uuid,
} from '../../../utils';
import { checkValidJsonSchema } from '../../../utils/validateJsonSchema';
import JSONView from "@mybricks/coder";
import ReturnSchema from '../returnSchema';
import ParamsEdit from '../paramsEdit';
import Params from '../params';
import OutputSchemaEdit from '../outputSchemaEdit';
import FormItem from '../../../components/FormItem';
import { cloneDeep } from '../../../utils/lodash';
import Button from '../../../components/Button';
import { notice } from '../../../components';
import Tooltip from '../../../components/tooltip';
import { CDN, PLUGIN_CONNECTOR_NAME } from '../../../constant';

import styles from './index.less';

export interface Model {
	id: string;
	input: string;
	output: string;
	inputSchema?: any;
	params?: any;
	title: string;
	type: string
	path: string;
	desc?: string;
	method: string;
	markList?: Array<{
		title: string;
		id: string;
		predicate?: {
			key: string;
			value: string;
			operator: string;
		},
		outputKeys: string[];
		excludeKeys: string[];
		outputSchema?: any;
		resultSchema?: any;
	}>;
}
export interface DebugProps {
	model: Model;
	onChangeModel(model: Model): void;
	connect(connector: Record<string, any>, params: any): Promise<any>;
	registerBlur(key: string, blur: () => void): void;
}

function DataShow({ data }: any) {
  let valueStr = '';
  try {
    valueStr = JSON.stringify(data, null, 2);
  } catch (error) {
    console.log(error, 'error');
  }
	
	return !valueStr ? null : (
		<div style={{marginLeft: 87}}>
			<div className={styles.title}>标记后的返回结果示例</div>
			{/* @ts-ignore */}
			<JSONView
				value={valueStr}
				height={300}
				language='json'
				theme='light'
				options={{ readOnly: true }}
			/>
		</div>
	);
}

const CodeIcon = (
	<svg viewBox="0 0 1027 1024" width="16" height="16" fill="currentColor">
		<path d="M321.828571 226.742857c-14.628571-14.628571-36.571429-14.628571-51.2 0L7.314286 482.742857c-14.628571 14.628571-14.628571 36.571429 0 51.2l256 256c14.628571 14.628571 36.571429 14.628571 51.2 0 14.628571-14.628571 14.628571-36.571429 0-51.2L87.771429 512l234.057142-234.057143c7.314286-14.628571 7.314286-36.571429 0-51.2z m263.314286 0c-14.628571 0-36.571429 7.314286-43.885714 29.257143l-131.657143 497.371429c-7.314286 21.942857 7.314286 36.571429 29.257143 43.885714s36.571429-7.314286 43.885714-29.257143l131.657143-497.371429c7.314286-14.628571-7.314286-36.571429-29.257143-43.885714z m431.542857 256l-256-256c-14.628571-14.628571-36.571429-14.628571-51.2 0-14.628571 14.628571-14.628571 36.571429 0 51.2L936.228571 512l-234.057142 234.057143c-14.628571 14.628571-14.628571 36.571429 0 51.2 14.628571 14.628571 36.571429 14.628571 51.2 0l256-256c14.628571-14.628571 14.628571-43.885714 7.314285-58.514286z"></path>
	</svg>
);
const Debug: FC<DebugProps> = ({ model, onChangeModel, connect, registerBlur }) => {
  const [remoteData, setData] = useState<any>();
	const [showParamsCode, setShowParamsCode] = useState(false);
	const [showResponseCode, setShowResponseCode] = useState(false);
  const allDataRef = useRef<any>();
  const willUpdateResultSchemaRef = useRef<any>();
	/** 编辑 schema 时 */
  const willUpdateResultSchemaForEditRef = useRef<any>();
  const codeTextRef = useRef<HTMLTextAreaElement>(null);
  const responseCodeTextRef = useRef<HTMLTextAreaElement>(null);
  const [errorInfo, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showPreviewSchema, setShowPreviewSchema] = useState(false);
  const [showMarkAdder, setShowMarkAdder] = useState(false);
  const [markGroupId, setMarkGroupId] = useState('default');
	const markAdderInputValue = useRef('');
	const markInputRef = useRef<any>();
	const curMark = useMemo(() => model.markList?.find(mark => mark.id === markGroupId), [model, markGroupId]);

	const initModel = useCallback((model) => {
		let newModel = model;
		if (!model.markList?.length) {
			newModel = {
				...model,
				outputKeys: undefined,
				excludeKeys: undefined,
				outputSchema: undefined,
				resultSchema: undefined,
				markList: [{
					title: '默认',
					id: 'default',
					predicate: {},
					outputKeys: model.outputKeys || [],
					excludeKeys: model.excludeKeys || [],
					outputSchema: model.outputSchema || {},
					resultSchema: model.resultSchema,
				}]
			};
		}

		if (!model.params) {
			newModel = { ...newModel, params: { type: 'root', name: 'root', children: [] } };
		}
		onChangeModel(newModel);
	}, [onChangeModel]);
	const extractKeysByResultSchema = useCallback((outputKeys = [], excludeKeys = [], originSchema) => {
		let newOutputKeys = [...outputKeys], newExcludeKeys = [...excludeKeys];
		if (!originSchema) {
			return { outputKeys: [], excludeKeys: [] };
		}

		newOutputKeys = outputKeys
			.filter(Boolean)
			.map(key => key.split('.'))
			.filter(keys => {
				let schema = originSchema.properties || originSchema.items?.properties;

				for (let idx = 0; idx < keys.length; idx++) {
					const key = keys[idx];

					if (schema && schema[key]) {
						schema = schema[key].properties || schema[key].items?.properties;
					} else {
						return false;
					}
				}

				return true;
			})
			.map(keys => keys.join('.'));
		newExcludeKeys = excludeKeys
			.filter(Boolean)
			.map(key => key.split('.'))
			.filter(keys => {
				let schema = originSchema.properties || originSchema.items?.properties;

				for (let idx = 0; idx < keys.length; idx++) {
					const key = keys[idx];

					if (schema && schema[key]) {
						schema = schema[key].properties || schema[key].items?.properties;
					} else {
						return false;
					}
				}

				return true;
			})
			.map(keys => keys.join('.'));

		return { outputKeys: newOutputKeys, excludeKeys: newExcludeKeys };
	}, []);

	const onConfirmTip = () => {
		try {
			formatSchema(willUpdateResultSchemaRef.current);
			const inputSchema = paramsToSchema(model.params || {});
			formatSchema(inputSchema);
			model.inputSchema = inputSchema;
			const newMarkList = JSON.parse(JSON.stringify(model.markList));
			const mark = newMarkList.find(m => m.id === markGroupId);

			if (!mark) {
				throw Error('当前标记组不存在');
			}
			let { outputKeys = [], excludeKeys = [] } = extractKeysByResultSchema(mark.outputKeys, mark.excludeKeys, willUpdateResultSchemaRef.current);
			let outputData = getDataByExcludeKeys(getDataByOutputKeys(allDataRef.current, outputKeys), excludeKeys);
			let outputSchema = jsonToSchema(outputData);

			/** 当标记单项时，自动返回单项对应的值 */
			if (Array.isArray(outputKeys) && outputKeys.length && (outputKeys.length > 1 || !(outputKeys.length === 1 && outputKeys[0] === ''))) {
				try {
					let cascadeOutputKeys = [...outputKeys].map(key => key.split('.'));
					while (Object.prototype.toString.call(outputData) === '[object Object]' && cascadeOutputKeys.every(keys => !!keys.length) && Object.values(outputData).length === 1) {
						outputData = Object.values(outputData)[0];
						outputSchema = Object.values(outputSchema.properties)[0];
						cascadeOutputKeys.forEach(keys => keys.shift());
					}
				} catch {}
			}
			formatSchema(outputSchema);
			setData(outputData);

			mark.outputKeys = outputKeys;
			mark.excludeKeys = excludeKeys;
			mark.outputSchema = outputSchema;
			mark.resultSchema = willUpdateResultSchemaRef.current;

			onChangeModel({ ...model, markList: newMarkList });
		} catch (error: any) {
			console.error(error);
			const isError = error instanceof Error;
			setError(isError ? (error?.message || (error as any)) : `接口错误：${typeof error === 'string' ? error : `由全局响应错误拦截透出，值为 ${JSON.stringify(error)}`}`);
		}
		setShowTip(false);
		setShowPreviewSchema(false);
	};
  const onDebugClick = async () => {
    try {
      if (!model.path) {
	      notice('接口的请求路径不能为空', { type: 'warning' });
				return;
      }
      const originParams = model.params || {};
      let params = params2data(originParams);

			/** 存在文件调试时，转为 formDta */
	    if (['POST', 'PUT'].includes(model.method) && hasFile(originParams)) {
				const formData = new FormData();

				Object.keys(params).forEach(key => {
					const value = params[key];
					if(Array.isArray(value)) {
						if (value[0] instanceof File) {
							value.forEach(file => formData.append(key, file));
						} else {
							formData.append(key, JSON.stringify(value));
						}
					} else if (typeof value === 'object') {
						formData.append(key, value instanceof File ? value : JSON.stringify(value));
					} else {
						formData.append(key, value);
					}
				});
		    params = formData;
	    }
      setError('');
	    allDataRef.current = await connect(
	      { type: model.type || 'http', mode: 'test', id: model.id, connectorName: PLUGIN_CONNECTOR_NAME, content: model },
	      params
      );
	    const resultSchema = jsonToSchema(allDataRef.current);
	    willUpdateResultSchemaRef.current = resultSchema || {};

			if (curMark.resultSchema && JSON.stringify(curMark.resultSchema) !== JSON.stringify(willUpdateResultSchemaRef.current)) {
				setShowTip(true);
			} else {
				onConfirmTip();
			}
    } catch (error: any) {
      console.error(error);
	    const isError = error instanceof Error;
	    setError(isError ? (error?.message || (error as any)) : `接口错误：${typeof error === 'string' ? error : `由全局响应错误拦截透出，值为 ${JSON.stringify(error)}`}`);
    }
	  setShowPreviewSchema(false);
  };
	const onCloseTip = useCallback(() => {
		setShowTip(false);
		setShowPreviewSchema(false);
	}, []);
	const onToggleSchemaPreview = useCallback(() => setShowPreviewSchema(show => !show), []);
  const onParamsChange = useCallback((params) => {
    if (params !== void 0) {
      const inputSchema = paramsToSchema(params);
      formatSchema(inputSchema);
			onChangeModel({ ...model, inputSchema, params });
    }
  }, [model, onChangeModel]);
  const onMarkChange = useCallback((mark) => {
		let { outputKeys = [], excludeKeys = [], resultSchema } = mark;

	  try {
		  /** 当标记单项时，自动返回单项对应的值 */
		  let autoExtra = false;
			
		  let outputSchema: any = {};
		  if (outputKeys.length === 0) {
			  outputSchema = resultSchema;
		  } else if (outputKeys.length === 1 && outputKeys[0] === '') {
			  outputSchema = { type: 'any' };
		  } else {
			  outputSchema = resultSchema.type === 'array'
				  ? { type: 'array', items: (resultSchema.items?.type === 'object' ? { type: 'object', properties: {} } : (resultSchema.items?.type === 'array' ? { type: 'array', items: {} } : { type: resultSchema.items?.type })) }
				  : { type: 'object', properties: {} };
				
			  outputKeys.forEach((key: string) => {
				  let subSchema = outputSchema.properties || outputSchema.items?.properties || outputSchema.items?.items;
				  let subResultSchema = resultSchema.properties || resultSchema.items?.properties || resultSchema.items?.items;
				  const keys = key.split('.');
					
				  keys.forEach((field, index) => {
						if (!subSchema || !subResultSchema || !subResultSchema[field]) {
							return;
						}
						
						if (index === keys.length - 1) {
							subSchema[field] = { ...subResultSchema[field] };
						} else {
							const { type } = subResultSchema[field];
							
							if (type === 'array') {
								subSchema[field] = subSchema[field] || {
									...subResultSchema[field],
									items: (subResultSchema[field].items.type === 'object' ? { type: 'object', properties: {} } : (subResultSchema[field].items.type === 'array' ? { type: 'array', items: {} } : { type: subResultSchema[field].items.type }))
								};
								subSchema = subSchema[field].items.properties;
								subResultSchema = subResultSchema[field].items.properties;
							} else if (type === 'object') {
								subSchema[field] = subSchema[field] || { ...subResultSchema[field], properties: {} };
								subSchema = subSchema[field].properties;
								subResultSchema = subResultSchema[field].properties;
							} else {
								subSchema[field] = { ...subResultSchema[field] };
								subSchema = subSchema[field].properties;
								subResultSchema = subResultSchema[field].properties;
							}
						}
				  });
			  });
			  if (Object.keys(outputSchema.properties).length === 1) {
				  autoExtra = true;
			  }
		  }
		
		  excludeKeys = excludeKeys
			  .map(key => key.split('.'))
			  .filter(keys => {
				  let schema = outputSchema.properties || outputSchema.items?.properties;
				
				  for (let idx = 0; idx < keys.length; idx++) {
					  const key = keys[idx];
					
					  if (schema && schema[key]) {
						  schema = schema[key].properties || schema[key].items?.properties;
					  } else {
						  return false;
					  }
				  }
				
				  return true;
			  })
			  .map(keys => keys.join('.'));
			
		  let newOutputSchema = cloneDeep(outputSchema);
		  excludeKeys?.forEach((key: string) => {
			  const keys = key.split('.');
			  const len = keys.length;
			  let schema = newOutputSchema;
			  for (let i = 0; i < len - 1; i++) {
				  schema = (schema.properties || schema.items.properties)[keys[i]];
			  }
			  try {
				  Reflect.deleteProperty(
					  schema.properties || schema.items.properties,
					  keys[len - 1]
				  );
			  } catch (error) {}
		  });
			
		  try {
			  const cloneData = cloneDeep(allDataRef.current);
			  let outputData = getDataByOutputKeys(getDataByExcludeKeys(cloneData, excludeKeys), outputKeys);
			
			  if (autoExtra) {
				  try {
					  let cascadeOutputKeys = outputKeys.map(key => key.split('.'));
					  while (newOutputSchema.type === 'object' && cascadeOutputKeys.every(keys => !!keys.length) && Object.values(newOutputSchema.properties || {}).length === 1) {
						  outputData = allDataRef.current ? Object.values(outputData)[0] : outputData;
						  newOutputSchema = Object.values(newOutputSchema.properties)[0];
						  cascadeOutputKeys.forEach(keys => keys.shift());
					  }
				  } catch(e) {
						console.log(e);
				  }
			  }
			  if (outputData !== void 0) {
				  setData(allDataRef.current ? outputData : undefined);
			  }
		  } catch (error) {}

		  const index = model.markList.findIndex(m => m.id === mark.id);
		  mark.outputKeys = outputKeys;
		  mark.excludeKeys = excludeKeys;
		  mark.outputSchema = newOutputSchema;
		  model.markList.splice(index, 1, { ...mark });

			onChangeModel({ ...model, markList: [...model.markList] });
	  } catch (error) {
      console.log(error);
    }
  }, [model]);
  const onMockSchemaChange = useCallback((schema) => willUpdateResultSchemaForEditRef.current = schema, []);
  const editResultSchema = useCallback(() => {
		willUpdateResultSchemaForEditRef.current = curMark.resultSchema;
	  setEdit(true);
  }, [curMark]);
  const saveResultSchema = useCallback(() => {
	  const mark = model.markList.find(m => m.id === markGroupId);

	  if (mark) {
		  mark.resultSchema = willUpdateResultSchemaForEditRef.current;
		  const { outputKeys, excludeKeys } = extractKeysByResultSchema(mark.outputKeys, mark.excludeKeys, mark.resultSchema);
			onMarkChange({ ...mark, outputKeys, excludeKeys });
	  }
	  setEdit(false);
  }, [markGroupId, model, onMarkChange]);
	const cancelEditResultSchema = useCallback(() => {
		willUpdateResultSchemaForEditRef.current = undefined;
		setEdit(false);
	}, []);
  const openMarkAdder = useCallback(() => setShowMarkAdder(true), []);
  const closeMarkAdder = useCallback(() => setShowMarkAdder(false), []);
	const onChangeMarkInput = useCallback(e => markAdderInputValue.current = e.target.value, []);
	const addMark = useCallback(() => {
		const id = uuid();
		const defaultMark = model.markList.find(m => m.id === 'default');
		onChangeModel({
			...model,
			markList: [
				...model.markList,
				{
					title: markAdderInputValue.current,
					id: id,
					outputKeys: [],
					excludeKeys: [],
					resultSchema: defaultMark?.resultSchema,
					outputSchema: defaultMark?.resultSchema,
				}
			]
		});
		markAdderInputValue.current = '';
		setShowMarkAdder(false);
		setMarkGroupId(id);
	}, [model]);
	const onMarkInputPressEnter = useCallback(e => {
		if(e.keyCode === 13 || e.key === 'Enter') {
			addMark();
		}
	}, [addMark]);
	const onCancelMark = useCallback((id: string) => {
		const index = model.markList.findIndex(m => m.id === id);
		const isFocus = markGroupId === model.markList[index]?.id;
		model.markList.splice(index, 1);

		onChangeModel({ ...model, markList: [...model.markList] });
		isFocus && setMarkGroupId(model.markList[index - 1].id);
	}, [model, markGroupId]);
	const onSelectMarkGroup = useCallback(id => {
		setMarkGroupId(id);
		setData(undefined);
	}, []);

	const toggleParamsCodeShow = useCallback(event => {
		event.stopPropagation();
		if (showParamsCode) {
			try {
				if(!model.inputSchema && !codeTextRef.current?.value) {
					setShowParamsCode(!showParamsCode);
					return
				}
				const jsonSchema = JSON.parse(codeTextRef.current?.value);
				if (jsonSchema.type === 'object' && !!jsonSchema.properties) {
					if (JSON.stringify(model.inputSchema) !== JSON.stringify(jsonSchema)) {
						const [result, errorFields] = checkValidJsonSchema(jsonSchema);
						if(result === false) {
							notice(`JSON 解析错误，${errorFields.length ? errorFields[0].msg + '，' : ''}此次变更被忽略`, { type: 'warning' });
							// 关闭code
							setShowParamsCode(!showParamsCode);
							return
						}
						onChangeModel({ ...model, inputSchema: jsonSchema, params: extractParamsBySchema(jsonSchema) });
					}
				} else if (Object.prototype.toString.call(jsonSchema) === '[object Object]') {
					const { params, originSchema } = extractParamsAndSchemaByJSON(jsonSchema);

					onChangeModel({ ...model, inputSchema: originSchema, params: params });
				} else {
					notice('JSON 描述不合法，此次变更被忽略', { type: 'warning' });
				}
			} catch (e) {
				console.warn('JSON 解析错误', e);
				notice('JSON 解析错误，此次变更被忽略', { type: 'warning' });
			}
		}

		setShowParamsCode(!showParamsCode);
	}, [showParamsCode]);

	// TODO: outputKey 重置
	const toggleResponseCodeShow = useCallback(event => {
		event.stopPropagation();
		if (showResponseCode) {
			try {
				if(!curMark.resultSchema && !responseCodeTextRef.current?.value) {
					// 关闭code
					setShowResponseCode(!showResponseCode);
					return
				}
				const jsonSchema = JSON.parse(responseCodeTextRef.current?.value);
				if (JSON.stringify(curMark.resultSchema) !== JSON.stringify(jsonSchema)) {
					const [result, errorFields = []] = checkValidJsonSchema(jsonSchema);
					if(result === false) {
						notice(`JSON 解析错误，${errorFields.length ? errorFields[0].msg + ',' : ''}此次变更被忽略`, { type: 'warning' });
						// 关闭code
						setShowResponseCode(!showResponseCode);
						return;
					}
					const newMarkList = cloneDeep(model.markList);
					const mark = newMarkList.find(m => m.id === curMark.id);

					if (!mark) {
						notice('当前标记组不存在，此次变更被忽略', { type: 'warning' });
						// 关闭code
						setShowResponseCode(!showResponseCode);
						return;
					}

					const { outputKeys, excludeKeys } = extractKeysByResultSchema(mark.outputKeys, mark.excludeKeys, jsonSchema);
					onMarkChange({ ...mark, outputKeys, excludeKeys, resultSchema: jsonSchema });
				}
			} catch (e) {
				console.warn('JSON 解析错误', e);
				notice('JSON 解析错误，此次变更被忽略', { type: 'warning' });
			}
		}

		setShowResponseCode(!showResponseCode);
	}, [showResponseCode, curMark, model, onMarkChange]);

	/** 当切换接口，params 变化 */
	useEffect(() => {
		setError('');
		initModel(model);
	}, [model.id]);

	useEffect(() => {
		showMarkAdder && markInputRef.current?.focus?.();
	}, [showMarkAdder]);

	return (
    <>
			<div className={styles.paramEditContainer}>
				{showParamsCode ? (
					<FormItem label='请求参数' labelTop>
						<textarea
							ref={codeTextRef}
							className={`${styles.codeText}  ${styles.textEdt}`}
							cols={30}
							rows={10}
							defaultValue={JSON.stringify(model.inputSchema, null, 2)}
						/>
						<div>支持识别 JSON、JSON Schema 等描述协议</div>
					</FormItem>
				) : (
					<Fragment key={model.id}>
						<FormItem label='请求参数' labelTop>
							<ParamsEdit value={model.params} onChange={onParamsChange} />
						</FormItem>
						<FormItem>
							<Params
								showTip={showTip}
								onCloseTip={onCloseTip}
								onToggleSchemaPreview={onToggleSchemaPreview}
								showPreviewSchema={showPreviewSchema}
								onConfirmTip={onConfirmTip}
								onDebugClick={onDebugClick}
								params={model.params}
							/>
						</FormItem>
					</Fragment>
				)}

				<div className={`${styles.codeIcon} ${showParamsCode ? styles.focus : ''}`} onClick={toggleParamsCodeShow}>
					{CodeIcon}
				</div>
			</div>
	    {showPreviewSchema
		    ? (
			    <FormItem label='预览类型' labelTop>
				    <ReturnSchema
					    outputKeys={[]}
					    excludeKeys={[]}
					    noMark
					    schema={willUpdateResultSchemaRef.current}
				    />
			    </FormItem>
		    )
		    : (
					edit ? (
				    <FormItem label='返回数据' labelTop>
					    <div className={styles.buttonGroup}>
						    <div></div>
						    <div>
							    <Button onClick={cancelEditResultSchema}>
								    取消
							    </Button>
							    <Button onClick={saveResultSchema}>
								    保存
							    </Button>
						    </div>
					    </div>
					    <OutputSchemaEdit
						    key={model.id}
						    schema={curMark.resultSchema}
						    onChange={onMockSchemaChange}
					    />
				    </FormItem>
			    ) : (
				    <>
					    <FormItem label='返回数据' className={styles.scrollFormItem} labelTop>
						    {showResponseCode ? (
							    <>
								    <div className={styles.buttonGroup}>
									    <div></div>
									    <div className={`${styles.codeIcon} ${styles.responseCodeIcon} ${showResponseCode ? styles.focus : ''}`} onClick={toggleResponseCodeShow}>
										    {CodeIcon}
									    </div>
								    </div>
										<textarea
											ref={responseCodeTextRef}
											className={`${styles.codeText}  ${styles.textEdt}`}
											cols={30}
											rows={10}
											defaultValue={JSON.stringify(curMark.resultSchema, null, 2)}
										/>
								    <div>支持识别JSON Schema 描述协议</div>
							    </>
						    ) : (
							    <>
								    <div className={styles.buttonGroup}>
									    <div className={styles.categoryContainer}>
										    <div className={styles.buttons}>
											    {model.markList?.map((option) => {
												    return (
													    <div
														    key={option.id}
														    className={`${styles.option} ${option.id === markGroupId ? styles.selected : ''}`}
														    onClick={() => onSelectMarkGroup(option.id)}
													    >
														    {option.title}
														    {option.id !== 'default' ? (
															    <div
																    className={styles.optionCancelIcon}
																    onClick={event => {
																	    event.stopPropagation();
																	    onCancelMark(option.id);
																    }}
															    >
																    ✕
															    </div>
														    ) : null}
													    </div>
												    );
											    })}
										    </div>
										    <Tooltip content="添加数据标记组">
											    {showMarkAdder ? (
												    <div className={styles.iconRootClose} onClick={closeMarkAdder}>
													    ✕
												    </div>
											    ) : (
												    <div className={styles.iconRootAdder} onClick={openMarkAdder}>
													    +
												    </div>
											    )}
										    </Tooltip>
										    {showMarkAdder ? (
											    <div className={styles.markAdder}>
												    <input className={styles.markInput} ref={markInputRef} onKeyUp={onMarkInputPressEnter} onChange={onChangeMarkInput} />
												    <button className={styles.button} onClick={addMark}>确定</button>
											    </div>
										    ) : null}
									    </div>
									    <div className={styles.rightBox}>
										    <Tooltip content="编辑返回数据类型">
											    <Button style={{ boxSizing: 'border-box' }} onClick={editResultSchema}>
												    编辑
											    </Button>
										    </Tooltip>
										    <div className={`${styles.codeIcon} ${styles.responseCodeIcon} ${showResponseCode ? styles.focus : ''}`} onClick={toggleResponseCodeShow}>
											    {CodeIcon}
										    </div>
									    </div>
								    </div>
								    {curMark ? (
									    <ReturnSchema
										    key={curMark.id}
										    mark={curMark}
										    onMarkChange={onMarkChange}
										    schema={curMark.resultSchema}
										    error={errorInfo}
										    registerBlur={registerBlur}
									    />
								    ) : null}
							    </>
						    )}
					    </FormItem>
					    <DataShow data={remoteData}/>
				    </>
		      )
		    )}
		</>
  );
};

export default Debug;