import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	formatSchema,
	getDataByExcludeKeys,
	getDataByOutputKeys,
	getDecodeString,
	jsonToSchema,
	params2data,
} from '../../../utils';
import JSONView from '@mybricks/code-editor';
import ReturnShema from '../returnSchema';
import ParamsEdit from '../paramsEdit';
import Params from '../params';
import OutputSchemaMock from '../outputSchemaMock';
import FormItem from '../../../components/FormItem';
import { getScript } from '../../../script';
import { cloneDeep } from '../../../utils/lodash';
import Button from '../../../components/Button';

import css from './index.less';

function DataShow({ data }: any) {
  let valueStr = '';
  try {
    valueStr = JSON.stringify(data, null, 2);
  } catch (error) {
    console.log(error, 'error');
  }
	
	return !valueStr ? null : (
		<div style={{marginLeft: 87}}>
			<div className={css.title}>标记后的返回结果示例</div>
			{/* @ts-ignore */}
			<JSONView
				value={valueStr}
				language='json'
				env={{
					isNode: false,
					isElectronRenderer: false,
				}}
				readOnly
			/>
		</div>
	);
}

export default function Debug({ sidebarContext, validate, globalConfig }: any) {
  const [schema, setSchema] = useState(sidebarContext.formModel.resultSchema);
  const [remoteData, setData] = useState<any>();
  const allDataRef = useRef<any>();
  const [errorInfo, setError] = useState('');
  const [params, setParams] = useState(sidebarContext.formModel.params);
  const [edit, setEdit] = useState(false);
  sidebarContext.formModel.params = sidebarContext.formModel.params || {
    type: 'root',
    name: 'root',
    children: [],
  };
  useEffect(() => {
    setSchema(sidebarContext.formModel.resultSchema);
  }, [sidebarContext.formModel.resultSchema]);

  const onDebugClick = async () => {
    try {
      if (!validate()) return;
      const originParams = sidebarContext.formModel.paramsList?.[0].data || [];
      const params = params2data(originParams);
      // setData([]);
      setError('');
      const data = await sidebarContext.connector.test(
        {
          type: sidebarContext.formModel.type || 'http',
          mode: 'test',
          id: sidebarContext.formModel.id,
          script: getDecodeString(
            getScript({
              ...sidebarContext.formModel,
              globalParamsFn: globalConfig.paramsFn,
              globalResultFn: globalConfig.resultFn,
              path: sidebarContext.formModel.path.trim(),
              resultTransformDisabled: true,
            })
          ),
        },
        params
      );
      allDataRef.current = data;
      let { outputKeys = [], excludeKeys = [] } = sidebarContext.formModel;
	    const resultSchema = jsonToSchema(data);
	    sidebarContext.formModel.resultSchema = resultSchema;
	
	    outputKeys = outputKeys
				.map(key => key.split('.'))
				.filter(keys => {
					let schema = resultSchema.properties || resultSchema.items?.properties;
					
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
	    excludeKeys = excludeKeys
		    .map(key => key.split('.'))
		    .filter(keys => {
			    let schema = resultSchema.properties || resultSchema.items?.properties;
			
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
	
	    let outputData = getDataByExcludeKeys(getDataByOutputKeys(data, outputKeys), excludeKeys);
	    let outputSchema = jsonToSchema(outputData);
	    /** 当标记单项时，自动返回单项对应的值 */
	    if (Array.isArray(outputKeys) && (outputKeys.length > 1 || !(outputKeys.length === 1 && outputKeys[0] === ''))) {
		    try {
					let cascadeOutputKeys = [...outputKeys].map(key => key.split('.'));
			    while (Object.prototype.toString.call(outputData) === '[object Object]' && cascadeOutputKeys.every(keys => !!keys.length) && Object.values(outputData).length === 1) {
				    outputData = Object.values(outputData)[0];
				    outputSchema = Object.values(outputSchema.properties)[0];
				    cascadeOutputKeys.forEach(keys => keys.shift());
			    }
		    } catch {}
	    }
	
      setData(outputData);
	
      formatSchema(sidebarContext.formModel.resultSchema);
	    formatSchema(outputSchema);
	    const inputSchema = jsonToSchema(params || {});
	    formatSchema(inputSchema);
	    sidebarContext.formModel.outputKeys = outputKeys;
	    sidebarContext.formModel.excludeKeys = excludeKeys;
	    sidebarContext.formModel.outputSchema = outputSchema;
      sidebarContext.formModel.inputSchema = inputSchema;
      setSchema({ ...sidebarContext.formModel.resultSchema });
    } catch (error: any) {
      console.log(error);
      sidebarContext.formModel.outputSchema = void 0;
      sidebarContext.formModel.resultSchema = void 0;
      setError(error?.message || error);
    }
  };

  const onParamsChange = useCallback((params) => {
    if (params !== void 0) {
      const data = params2data(params || []);
      const inputSchema = jsonToSchema(data);
      formatSchema(inputSchema);
      sidebarContext.formModel.inputSchema = inputSchema;
      sidebarContext.formModel.params = params;
      setParams(params);
    }
  }, []);

  const onKeysChange = useCallback((outputKeys, excludeKeys) => {
    const { resultSchema } = sidebarContext.formModel;
		
	  try {
		  /** 当标记单项时，自动返回单项对应的值 */
		  let autoExtra = false;
			
		  let outputSchema: any = {};
		  if (outputKeys.length === 0) {
			  outputSchema = sidebarContext.formModel.resultSchema;
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
		
		  sidebarContext.formModel.outputKeys = outputKeys;
		  sidebarContext.formModel.excludeKeys = excludeKeys;
		  sidebarContext.formModel.outputSchema = newOutputSchema;
    } catch (error) {
      console.log(error);
    }
  }, []);

  const onOutputKeysChange = useCallback(
    (outputKeys) => {
      onKeysChange(outputKeys, sidebarContext.formModel.excludeKeys);
    },
    [sidebarContext]
  );

  const onExcludeKeysChange = useCallback(
    (excludeKeys) => {
      onKeysChange(sidebarContext.formModel.outputKeys, excludeKeys);
    },
    [sidebarContext]
  );

  const onMockSchemaChange = useCallback((schema) => {
    sidebarContext.formModel.resultSchema = schema;
  }, []);
  const editSchema = () => {
    setEdit(true);
  };
  const saveSchema = () => {
    setEdit(false);
  };
  return (
    <>
      <FormItem label='请求参数'>
        <ParamsEdit
          value={sidebarContext.formModel.params}
          ctx={sidebarContext}
          onChange={onParamsChange}
        />
      </FormItem>
      <FormItem>
        <Params
          onDebugClick={onDebugClick}
          ctx={sidebarContext}
          params={params}
        />
      </FormItem>
      {edit ? (
        <>
          <FormItem label='返回数据'>
            {sidebarContext.formModel.resultSchema ? (
              <Button
                style={{ margin: 0, marginBottom: 6 }}
                onClick={saveSchema}
              >
                保存
              </Button>
            ) : null}
            <OutputSchemaMock
              schema={sidebarContext.formModel.resultSchema}
              ctx={sidebarContext}
              onChange={onMockSchemaChange}
            />
          </FormItem>
        </>
      ) : (
        <>
          <FormItem label='返回数据'>
            {sidebarContext.formModel.resultSchema ? (
              <Button
                style={{ margin: 0, marginBottom: 6 }}
                onClick={editSchema}
              >
                编辑
              </Button>
            ) : null}
            <ReturnShema
              outputKeys={sidebarContext.formModel.outputKeys}
              excludeKeys={sidebarContext.formModel.excludeKeys}
              onOutputKeysChange={onOutputKeysChange}
              onExcludeKeysChange={onExcludeKeysChange}
              schema={schema}
              error={errorInfo}
            />
          </FormItem>
          <DataShow data={remoteData} />
        </>
      )}
    </>
  );
}
