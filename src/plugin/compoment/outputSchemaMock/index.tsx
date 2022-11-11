/**
 * 使用树形选择器完成字段映射
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSONView from '@mybricks/code-editor';
import * as Icons from '../../../icon';
import { uuid } from '../../../utils';
import { schema2params, params2schema } from './utils';
import { schema2data } from '../../../utils';
import { isEmpty } from '../../../utils/lodash';
import FormItem from '../../../components/FormItem';

import css from './index.less';

function DataShow({ data }: any) {
  let valueStr = '';
  try {
    valueStr = JSON.stringify(data, null, 2);
  } catch (error) {}
  return isEmpty(data) ? null : (
    <FormItem label='Mock数据'>
      <JSONView
        width={430}
        value={valueStr}
        language='json'
        env={{
          isNode: false,
          isElectronRenderer: false,
        }}
        readOnly
      />
    </FormItem>
  );
}

export default function ParamsEdit({ schema, value, onChange, ctx }: any) {
  const valueRef = useRef(value);
  const [mockData, setMockData] = useState<any>();
  const [params, setParams] = useState({ children: [] });
  valueRef.current = params;
  const updateValue = useCallback(() => {
    setParams({ ...valueRef.current });
    const schema = params2schema(valueRef.current);
    onChange(schema);
    setMockData(schema2data(schema));
  }, []);

  const resetValue = useCallback((item) => {
    ['minLength', 'maxLength', 'minimum', 'maximum'].forEach((key) => {
      Reflect.deleteProperty(item, key);
    });
    item.children = [];
  }, []);

  const set = useCallback((item, key, val) => {
    if (item[key] === val) return;
    item[key] = val;
    if (key === 'type') {
      resetValue(item);
      item['defaultValue'] = '';
      if (val === 'array') {
        item.children = [{ name: 'items', type: 'string', id: uuid() }];
      }
    }
    formatValue(item, key, val);
    ctx.editNowId = item.id;
    updateValue();
  }, []);

  useEffect(() => {
    setMockData(schema2data(schema));
    setParams(schema2params(schema));
  }, [schema]);
  const removeItem = (item, parent) => {
    parent.children = parent.children.filter(({ name }) => name !== item.name);
    if (parent.type === 'array') {
      parent.children.forEach((child, index) => {
        child.name = `${index}`;
        child.defaultValue = parent.children[index].defaultValue;
      });
    }
    ctx.editNowId = void 0;
    updateValue();
  };

  const addItem = (item, parent) => {
    const id = uuid();
    if (item && (item.type === 'object' || item.type === 'array')) {
      item.children = item.children || [];
      let name = `name${item.children.length + 1}`;
      if (item.type === 'array') {
        name = `${item.children.length}`;
      }
      item.children.push({ id, name, type: 'string' });
    } else {
      parent.children = parent.children || [];
      const name = `name${parent.children.length + 1}`;
      parent.children.push({ id, type: 'string', name });
    }
    ctx.editNowId = void 0;
    updateValue();
  };

  const processAry = useCallback((item, depth) => {
    return item.children.map((child: any) => {
      return processItem(child, item, depth);
    });
  }, []);

  const processItem = useCallback((item, parent, depth = -1) => {
    if (!item) return null;
    const { type } = item;
    let jsx;
    if (type === 'root') {
      return <div className={css.list}>{processAry(item, depth + 1)}</div>;
    }
    if (item.children) {
      jsx = processAry(item, depth + 1);
    }

    const isArray = parent.type === 'array';
    const hasDefaultValue = item.defaultValue !== void 0 && item.defaultValue !== '';

    const addAble =
      (depth === 0 &&
        parent.children?.[
          Math.min(
            parent.children.findLastIndex(
              ({ type }: any) => type === 'string' || type === 'number'
            ),
            parent.children.length - 1
          )
        ]?.name === item.name) ||
      type === 'object' ||
      (isArray &&
        item.name === 'items' &&
        (type === 'object' || type === 'array'));

    return (
      <div key={item.id} className={css.ct}>
        <div className={css.item}>
          <input
            style={{ width: 162 - depth * 20 }}
            type='text'
            value={
              isArray && item.name !== 'items' ? `[${item.name}]` : item.name
            }
            disabled={isArray}
            onChange={(e) => set(item, 'name', e.target.value)}
          />
          <select
            className={css.type}
            value={item.type}
            onChange={(e) => set(item, 'type', e.target.value)}
          >
            <option label={'字符'} value={'string'} />
            <option label={'数字'} value={'number'} />
            <option label={'对象'} value={'object'} />
            <option label={'列表'} value={'array'} />
          </select>
          <input
            className={css.defaultValue}
            type='text'
            disabled={type === 'object' || type === 'array'}
            value={item.defaultValue}
            onChange={(e) => {
              const { value } = e.target;
              set(
                item,
                'defaultValue',
                value === '' ? void 0 : type === 'number' ? +value : value
              );
            }}
          />
          <div className={css.range}>
            <input
              className={`${css.min} ${item.minError ? css.error : ''}`}
              type='text'
              placeholder={getPlaceholder(item, false)}
              disabled={type === 'object' || hasDefaultValue}
              defaultValue={getValue(item, false)}
              onChange={(e) => {
                const { value } = e.target;
                set(item, getKey(item, false), value === '' ? void 0 : +value);
              }}
            />
            <div>~</div>
            <input
              className={`${css.max} ${item.maxError ? css.error : ''}`}
              placeholder={getPlaceholder(item)}
              type='text'
              disabled={type === 'object' || hasDefaultValue}
              defaultValue={getValue(item, true)}
              onChange={(e) => {
                const { value } = e.target;
                set(item, getKey(item, true), value == '' ? void 0 : +value);
              }}
            />
          </div>
          <div className={`${css.operate} ${css.flex}`}>
            <span
              className={`${css.iconRemove}`}
              onClick={(e) => removeItem(item, parent)}
            >
              {Icons.remove}
            </span>
            {addAble ? (
              <span
                className={css.iconAdder}
                onClick={() => addItem(item, parent)}
              >
                +
              </span>
            ) : null}
          </div>
        </div>
        {jsx}
      </div>
    );
  }, []);

  return (
    <>
      <div>
        {params?.children?.length === 0 ? (
          <div className={css.adder}>
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => addItem(valueRef.current, valueRef.current)}
            >
              +
            </span>
          </div>
        ) : (
          <>
            <div className={css.header}>
              <p className={css.fieldName}>字段名</p>
              <p className={css.type}>类型</p>
              <p className={css.defaultValue}>默认值</p>
              <p className={css.range}>自定义范围</p>
              <p className={css.operate}>操作</p>
            </div>
            <div className={css.content}>
              {processItem(valueRef.current, valueRef.current)}
            </div>
          </>
        )}
      </div>
      <div className={css.mockData}>
        <DataShow data={mockData} />
      </div>
    </>
  );
}

function getPlaceholder(item: any, max: boolean = true) {
  switch (item.type) {
    case 'array':
    case 'string':
      return max ? '最大长度' : '最小长度';

    case 'number':
      return max ? '最大值' : '最小值';

    default:
      return void 0;
  }
}

function getKey({ type }: any, max: boolean) {
  if (type === 'array') {
    return max ? 'maxItems' : 'minItems';
  }
  if (type === 'string') {
    return max ? 'maxLength' : 'minLength';
  }
  if (type === 'number') {
    return max ? 'maximum' : 'minimum';
  }
}

function getValue(item: any, max: boolean) {
  return item[getKey(item, max)];
}

function formatValue(item, key, val) {
  Reflect.deleteProperty(item, 'minError');
  Reflect.deleteProperty(item, 'maxError');

  function validate(item, val, start, end, le: boolean) {
    if (
      key === start &&
      item[end] !== void 0 &&
      (le ? val < item[end] : val > item[end])
    ) {
      key.startsWith('min') ? (item.minError = true) : (item.maxError = true);
    }
  }

  [
    ['minLength', 'maxLength', false],
    ['maxLength', 'minLength', true],
    ['minItems', 'maxItems', false],
    ['maxItems', 'minItems', true],
    ['minimum', 'maximum', false],
    ['maximum', 'minimum', true],
  ].forEach(([start, end, le]) => {
    validate(item, val, start, end, le);
  });
}
