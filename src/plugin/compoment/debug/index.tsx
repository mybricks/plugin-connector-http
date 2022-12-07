import React, { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../../../utils/lodash';
import {
  formatSchema,
  getDataByOutputKeys,
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
import Switch from '../../../components/Switch';
import FormItem from '../../../components/FormItem';
import { getScript } from '../../../script';
import { DEFAULT_SCHEMA } from '../../../constant';
import css from './index.less';

function DataShow({ data }: any) {
  let valueStr = '';
  try {
    valueStr = JSON.stringify(data, null, 2);
  } catch (error) {}
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
  const [useMock, setMock] = useState(false);
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
      const { outputKeys } = sidebarContext.formModel;
      const outputData = getDataByOutputKeys(data, outputKeys);
      setData(outputData);
      sidebarContext.formModel.resultSchema = jsonToSchema(data);
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

  const onOutputKeysChange = useCallback(
    (outputKeys) => {
      const { resultSchema } = sidebarContext.formModel;
      if (outputKeys !== void 0) {
        try {
          sidebarContext.formModel.outputKeys = outputKeys;
          let outputSchema: any = {};
          if (outputKeys.length === 0) {
            outputSchema = sidebarContext.formModel.resultSchema;
          } else if (outputKeys.length === 1) {
            if (outputKeys[0] === '') {
              outputSchema = { type: 'any' };
            } else {
              outputSchema = get(
                resultSchema.properties,
                outputKeys[0].split('.').join('.properties.')
              );
            }
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
                subSchema = subSchema[field].properties;
                subResultSchema = subResultSchema[field].properties;
              });
            });
            if (Object.keys(outputSchema.properties).length === 1) {
              outputSchema =
                outputSchema.properties[Object.keys(outputSchema.properties)[0]];
            }
          }
          setData(getDataByOutputKeys(allDataRef.current, outputKeys));
          sidebarContext.formModel.outputSchema = outputSchema;
        } catch (error) {}
      }
    },
    [sidebarContext]
  );

  const onMockSchemaChange = useCallback((schema) => {
    sidebarContext.formModel.resultSchema = schema;
  }, []);

  return (
    <>
      {/* <FormItem label='Mock'>
        <Switch
          defaultChecked={sidebarContext.formModel.useMock}
          onChange={(checked: boolean) => {
            sidebarContext.formModel.useMock = checked;
            if (checked) {
              sidebarContext.formModel.outputSchema =
                sidebarContext.formModel.outputSchema || DEFAULT_SCHEMA;
              sidebarContext.formModel.resultSchema =
                sidebarContext.formModel.resultSchema || DEFAULT_SCHEMA;
            }
            setMock(checked);
          }}
        />
      </FormItem> */}

      {useMock ? (
        <>
          <FormItem label='Mock规则'>
            <OutputSchemaMock
              schema={sidebarContext.formModel.resultSchema}
              ctx={sidebarContext}
              onChange={onMockSchemaChange}
            />
          </FormItem>
        </>
      ) : (
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
          <FormItem label='返回数据'>
            <ReturnShema
              value={sidebarContext.formModel.outputKeys}
              onChange={onOutputKeysChange}
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
