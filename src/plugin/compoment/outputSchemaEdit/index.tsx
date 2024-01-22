/**
 * 使用树形选择器完成字段映射
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Icons from '../../../icon';
import { uuid } from '../../../utils';
import { schema2params, params2schema } from './utils';
import { cloneDeep, findLastIndex } from '../../../utils/lodash';

import styles from './index.less';

const ROOT_PARAMS = { name: 'root', type: 'root', children: [] };
export default function OutputSchemaEdit({ schema, value, onChange, ctx }: any) {
  const valueRef = useRef(value);
  const [params, setParams] = useState(cloneDeep(ROOT_PARAMS));
  valueRef.current = params;
  const updateValue = useCallback(() => {
    setParams({ ...valueRef.current });
    const schema = params2schema(valueRef.current);
    onChange(schema);
  }, [schema, onChange]);

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
    setParams(schema ? schema2params(schema) : cloneDeep(ROOT_PARAMS));
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
      return <div className={styles.list}>{processAry(item, depth + 1)}</div>;
    }
    if (item.children) {
      jsx = processAry(item, depth + 1);
    }

    const isArray = parent.type === 'array';
    const addAble =
      (depth === 0 &&
        parent.children?.[
          Math.min(
            findLastIndex(parent.children, ({ type }) => type === 'string' || type === 'number' || type === 'boolean'),
            parent.children.length - 1
          )
        ]?.name === item.name) ||
      type === 'object' ||
      (isArray &&
        item.name === 'items' &&
        (type === 'object' || type === 'array'));

    const removeAble = !(isArray && item.name === 'items');
    return (
      <div key={item.id} className={styles.ct}>
        <div className={styles.item}>
          <input
            style={{ width: 331 - depth * 20 }}
            type='text'
            value={
              isArray && item.name !== 'items' ? `[${item.name}]` : item.name
            }
            disabled={isArray}
            onChange={(e) => set(item, 'name', e.target.value)}
          />
          <select
            className={styles.type}
            value={item.type}
            onChange={(e) => set(item, 'type', e.target.value)}
          >
            <option label={'字符'} value={'string'} />
            <option label={'数字'} value={'number'} />
            <option label={'布尔'} value={'boolean'} />
            <option label={'对象'} value={'object'} />
            <option label={'列表'} value={'array'} />
          </select>
          <div className={`${styles.operate} ${styles.flex}`}>
            {removeAble ? (
              <span
                className={`${styles.iconRemove}`}
                onClick={() => removeItem(item, parent)}
              >
                {Icons.remove}
              </span>
            ) : null}
            {addAble ? (
              <span
                className={styles.iconAdder}
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
  }, [onChange]);

  return (
    <div className={styles.editContainer}>
      {params?.children?.length === 0 ? (
        <div className={styles.adder}>
          <span onClick={() => addItem(valueRef.current, valueRef.current)}>
            +
          </span>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <p className={styles.fieldName}>字段名</p>
            <p className={styles.type}>类型</p>
            <p className={styles.operate}>操作</p>
          </div>
          <div className={styles.content}>
            {processItem(valueRef.current, valueRef.current)}
          </div>
        </>
      )}
    </div>
  );
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
    validate(item, val, start, end, le as boolean);
  });
}
