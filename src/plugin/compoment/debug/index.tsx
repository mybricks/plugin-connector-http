import React, { useCallback, useEffect, useRef, useState } from 'react';
import { json as GenerateSchema } from 'generate-schema';
import { get } from '../../../utils/lodash';
import { getParams } from '../paramsEdit/utils';
import { ROOTNAME } from '../../../constant';
import {
  formatSchema,
  getDataByOutputKeys,
  getDecodeString,
  params2data,
} from '../../../utils';
import JSONView from '@mybricks/code-editor';
import ReturnShema from '../returnSchema';
import { isEmpty } from '../../../utils/lodash';
import ParamsEdit from '../paramsEdit';
import Params from '../params';
import Input from '../../../components/Input';
import Switch from '../../../components/Switch';
import FormItem from '../../../components/FormItem';
import { getScript } from '../../../script';
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
      />
    </div>
  );
}

export default function Debug({ sidebarContext }: any) {
  const [schema, setSchema] = useState(sidebarContext.formModel.resultSchema);
  const [remoteData, setData] = useState<any>();
  const allDataRef = useRef<any>();
  const [errorInfo, setError] = useState('');

  sidebarContext.formModel.params = sidebarContext.formModel.params || {
    type: 'root',
    name: 'root',
    children: [],
  };
  // useEffect(() => {
  //   form.setFieldsValue({
  //     ...sidebarContext.formModel,
  //   });

  //   return () => form.resetFields();
  // }, [sidebarContext.formModel]);

  useEffect(() => {
    setSchema(sidebarContext.formModel.resultSchema);
  }, [sidebarContext.formModel.resultSchema]);

  const onDebugClick = async () => {
    try {
      try {
        // await panelForm.validateFields();
      } catch (error) {
        return;
      }
      const originParams = sidebarContext.formModel.paramsList?.[0].data || [];
      const params = params2data(originParams);
      setData([]);
      setError('');
      const data = await sidebarContext.connector.test(
        {
          type: 'http',
          script: getDecodeString(
            getScript({
              ...sidebarContext.formModel,
              mockAddress: sidebarContext.formModel.useMock && sidebarContext.formModel.mockAddress,
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
      sidebarContext.formModel.resultSchema = GenerateSchema('', data);
      formatSchema(sidebarContext.formModel.resultSchema);
      const outputSchema = GenerateSchema('', outputData);
      formatSchema(outputSchema);
      const inputSchema = GenerateSchema('', params || {});
      formatSchema(inputSchema);
      sidebarContext.formModel.outputSchema = outputSchema;
      sidebarContext.formModel.inputSchema = inputSchema;
      setSchema({ ...sidebarContext.formModel.resultSchema });
    } catch (error: any) {
      console.log(error);
      sidebarContext.formModel.outputSchema = void 0;
      sidebarContext.formModel.resultSchema = void 0;
      setError(error.message);
    }
  };

  const onParamsChange = useCallback((params) => {
    if (params !== void 0) {
      const data = params2data(params.children || []);
      sidebarContext.formModel.inputSchema = GenerateSchema(
        sidebarContext.formModel.id,
        data
      );
      sidebarContext.formModel.params = params;
    }
  }, []);

  const onOutputKeysChange = useCallback((outputKeys) => {
    const { resultSchema } = sidebarContext.formModel;
    if (outputKeys !== void 0) {
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
    }
  }, []);
  return (
    <>
      <FormItem label='Mock'>
        <Switch
          defaultChecked={sidebarContext.formModel.useMock}
          onChange={(checked: boolean) =>
            (sidebarContext.formModel.useMock = checked)
          }
        />
      </FormItem>

      <FormItem label="mock地址">
        <Input
          value={sidebarContext.formModel.mockAddress}
          onChange={(e) =>
            (sidebarContext.formModel.mockAddress = e.target.value)
          }
        />
      </FormItem>

      <FormItem label='请求参数'>
        <ParamsEdit
          value={sidebarContext.formModel.params}
          ctx={sidebarContext}
          onChange={onParamsChange}
        />
      </FormItem>
      <FormItem>
        <Params
          value={sidebarContext.formModel.paramsReal}
          onDebugClick={onDebugClick}
          ctx={sidebarContext}
        />
      </FormItem>
      {/* <Form.Item label='' name='paramsReal'>
        <Params onDebugClick={onDebugClick} ctx={sidebarContext} />
      </Form.Item> */}
      <FormItem label='返回数据'>
        <ReturnShema
          value={sidebarContext.formModel.outputKeys}
          onChange={onOutputKeysChange}
          schema={schema}
          error={errorInfo}
        />
      </FormItem>
      {/* <Form.Item label='返回数据' name='outputKeys'>
        <ReturnShema schema={schema} error={errorInfo} />
      </Form.Item> */}
      <DataShow data={remoteData} />
    </>
  );
}
