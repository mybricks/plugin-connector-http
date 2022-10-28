import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Switch, Input } from 'antd';
import { json as GenerateSchema } from 'generate-schema';
import { get } from '../../../utils/lodash';
import { getParams } from '../paramsEdit/utils';
import { ROOTNAME } from '../../../constant';
import {
  formatSchema,
  getDataByOutputKeys,
  getDecodeString,
} from '../../../utils';
import JSONView from '@mybricks/code-editor';
import ReturnShema from '../returnSchema';
import { isEmpty } from '../../../utils/lodash';
import ParamsEdit from '../paramsEdit';
import Params from '../params';
import { getScript } from '../../../script';
import css from './index.less';

const { Item } = Form;

function DataShow({ data }: any) {
  let valueStr = '';
  try {
    valueStr = JSON.stringify(data, null, 2);
  } catch (error) {}
  return isEmpty(data) ? null : (
    <div style={{ marginLeft: 87 }}>
      <div className={css.title}>标记后的返回结果示例</div>
      <JSONView value={valueStr} language='json' />
    </div>
  );
}

function params2data(params: any) {
  if (!params) return;
  let obj: any = {};

  if (params.type === 'string') {
    return params.defaultValue;
  }
  if (params.type === 'number') {
    return +params.defaultValue;
  }

  if (params.children) {
    if (params.type === 'array') {
      obj = [];
    }
    params.children.forEach((child: any) => {
      obj[child.name] = params2data(child);
    });
  }

  return obj;
}

export default function Debug({
  sidebarContext,
  context,
  panelForm,
  prefix,
}: any) {
  const [form] = Form.useForm();
  const [schema, setSchema] = useState(sidebarContext.formModel.resultSchema);
  const [remoteData, setData] = useState<any>();
  const allDataRef = useRef<any>();

  sidebarContext.formModel.params = sidebarContext.formModel.params || {
    type: 'root',
    name: 'root',
    children: [],
  };
  useEffect(() => {
    form.setFieldsValue({
      ...sidebarContext.formModel,
    });

    return () => form.resetFields();
  }, [sidebarContext.formModel]);

  useEffect(() => {
    setSchema(sidebarContext.formModel.resultSchema);
  }, [sidebarContext.formModel.resultSchema]);

  const onDebugClick = async () => {
    try {
      try {
        await panelForm.validateFields();
      } catch (error) {
        return;
      }
      const originParams = sidebarContext.formModel.paramsList?.[0].data || [];
      const params = params2data(originParams);
      setData([]);
      const data = await sidebarContext.connector.test({
        type: 'http',
        script: getDecodeString(
          getScript({
            ...sidebarContext.formModel,
            resultTransformDisabled: true,
            globalParamsFn: context.projectData.serviceTemplate.paramsFn,
          })
        )
      }, params);
      allDataRef.current = data;
      const { outputKeys } = sidebarContext.formModel;
      const outputData = getDataByOutputKeys(data, outputKeys);
      setData(outputData);
      sidebarContext.formModel.resultSchema = GenerateSchema('', data);
      formatSchema(sidebarContext.formModel.resultSchema);
      const outputSchema = GenerateSchema('', outputData);
      formatSchema(outputSchema);
      const inputSchema = GenerateSchema('', params || {});
      sidebarContext.formModel.outputSchema = outputSchema;
      sidebarContext.formModel.inputSchema = inputSchema;
      setSchema({ ...sidebarContext.formModel.resultSchema });
    } catch (error) {
      console.log(error);
    }
  };

  const onValuesChange = useCallback((changedValue: any, allValues: any) => {
    const { outputKeys, params, useMock, mockAddress } = changedValue;
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
    if (params !== void 0) {
      const actualParams: any = {};
      getParams(allValues.params[0], actualParams);
      sidebarContext.formModel.inputSchema = GenerateSchema(
        sidebarContext.formModel.id,
        actualParams[ROOTNAME]
      );
      sidebarContext.formModel.params = allValues.params;
    }
    if (useMock !== void 0) {
      sidebarContext.formModel.useMock = useMock;
    }
    if (mockAddress !== void 0) {
      sidebarContext.formModel.mockAddress = mockAddress;
    }
  }, []);
  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      className='fangzhou-theme'
      form={form}
      size='small'
      onValuesChange={onValuesChange}
    >
      <Form.Item label='Mock' name='useMock' valuePropName='checked'>
        <Switch />
      </Form.Item>
      <Form.Item
        label='mock地址'
        name='mockAddress'
        style={{ display: sidebarContext.formModel.useMock ? 'flex' : 'none' }}
      >
        <Input />
      </Form.Item>
      <Form.Item label='请求参数' name='params'>
        <ParamsEdit ctx={sidebarContext} />
      </Form.Item>
      <Form.Item label='' name='paramsReal'>
        <Params onDebugClick={onDebugClick} ctx={sidebarContext} />
      </Form.Item>
      <Form.Item label='返回数据' name='outputKeys'>
        <ReturnShema schema={schema} />
      </Form.Item>
      <DataShow data={remoteData} />
    </Form>
  );
}
