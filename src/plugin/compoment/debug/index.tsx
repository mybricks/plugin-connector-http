import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatSchema,
  getDataByOutputKeys,
  getDataByExcludeKeys,
  getDecodeString,
  jsonToSchema,
  params2data,
} from '../../../utils';
import JSONView from '@mybricks/code-editor';
import ReturnShema from '../returnSchema';
import { isEmpty } from '../../../utils/lodash';
import ParamsEdit from '../paramsEdit';
import Params from '../params';
import OutputSchemaMock from '../outputSchemaMock';
import FormItem from '../../../components/FormItem';
import { getScript } from '../../../script';
import css from './index.less';
import { cloneDeep } from '../../../utils/lodash/cloneDeep';
import Button from '../../../components/Button';

function DataShow({ data }: any) {
  let valueStr = '';
  try {
    valueStr = JSON.stringify(data, null, 2);
  } catch (error) {
    console.log(error, 'error');
  }
  return isEmpty(data) ? null : (
    <div style={{ marginLeft: 87 }}>
      <div className={css.title}>标记后的返回结果示例</div>
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
      setData([]);
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
      const { outputKeys, excludeKeys } = sidebarContext.formModel;
      const outputData = getDataByOutputKeys(data, outputKeys);
      sidebarContext.formModel.resultSchema = jsonToSchema(data);
      setData(getDataByExcludeKeys(outputData, excludeKeys));

      formatSchema(sidebarContext.formModel.resultSchema);
      const outputSchema = jsonToSchema(outputData);
      formatSchema(outputSchema);
      const inputSchema = jsonToSchema(params || {});
      formatSchema(inputSchema);
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
      sidebarContext.formModel.outputKeys = outputKeys;
      let outputSchema: any = {};
      if (outputKeys.length === 0) {
        outputSchema = sidebarContext.formModel.resultSchema;
      } else if (outputKeys.length === 1 && outputKeys[0] === '') {
        outputSchema = { type: 'any' };
      } else {
        outputSchema = {
          type: 'object',
          properties: {},
        };
        outputKeys.forEach((key: string) => {
          let subSchema = outputSchema.properties;
          let subResultSchema = resultSchema.properties;
          key.split('.').forEach((field) => {
            subSchema[field] = { ...subResultSchema[field] };
            const { type } = subSchema[field];
            if (type === 'array') {
              subSchema = subSchema[field].items.properties;
              subResultSchema = subResultSchema[field].items.properties;
            } else {
              subSchema = subSchema[field].properties;
              subResultSchema = subResultSchema[field].properties;
            }
          });
        });
        if (Object.keys(outputSchema.properties).length === 1) {
	        autoExtra = true;
          outputSchema =
            outputSchema.properties[Object.keys(outputSchema.properties)[0]];
        }
      }
      let newOutputSchma = cloneDeep(outputSchema);
      excludeKeys?.forEach((key: string) => {
        const keys = key.split('.');
        const len = keys.length;
        let schema = newOutputSchma;
        const start = outputKeys && outputKeys.length === 1 ? 1 : 0;
        for (let i = start; i < len - 1; i++) {
          schema = (schema.properties || schema.items.properties)[keys[i]];
        }
        try {
          Reflect.deleteProperty(
            schema.properties || schema.items.properties,
            keys[len - 1]
          );
        } catch (error) {}
      });
      sidebarContext.formModel.outputSchema = newOutputSchma;
      try {
        const cloneData = cloneDeep(allDataRef.current);
        const remanentData = getDataByExcludeKeys(cloneData, excludeKeys);
        let res = getDataByOutputKeys(remanentData, outputKeys);
				
				if (autoExtra) {
					res = Object.values(res)[0];
				}
        if (res !== void 0) {
          setData(res);
        }
      } catch (error) {}
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
      sidebarContext.formModel.excludeKeys = excludeKeys;
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
