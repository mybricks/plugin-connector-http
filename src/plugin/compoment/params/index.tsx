/**
 * 使用树形选择器完成字段映射
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cloneDeep } from '../../../utils/lodash';
import Button from '../../../components/Button';
import css from './index.less';

function merge(object: any, source: any, ctx: any) {
  if (!object || !source) return;

  if (ctx.editNowId && source.id === ctx.editNowId) {
    Object.keys(source).forEach((key) => {
      object[key] = source[key];
    });
    ctx.editNowId = void 0;
  }

  Object.keys(object).forEach((key) => {
    if (source[key] === void 0) {
      Reflect.deleteProperty(object, key);
    }
  });

  if (!source.children) {
    object.children = [];
    return;
  }

  if (object.children) {
    const objectIdMap = object.children.reduce((obj, cur) => {
      if (cur) {
        obj[cur.id] = cur;
      }
      return obj;
    }, {});
    const newObjectChildren: any = [];
    source.children.forEach((child: any, index: number) => {
      newObjectChildren.push(objectIdMap[child.id]);
    });

    object.children = newObjectChildren;
  }

  if (source.children) {
    source.children.forEach((child: any, index: number) => {
      object.children = object.children || [];
      if (object.children[index] === void 0) {
        object.children[index] = child;
      } else {
        merge(object.children[index], source.children[index], ctx);
      }
    });
  }
}

export default function ParamsEdit({ onDebugClick, ctx, params }: any) {
  const valueRef = useRef({});
  const [render, forceRender] = useState(0);

  const updateValue = useCallback(() => {
    // if (valueRef.current.children.length === 0) return;
    ctx.formModel.paramsList = [
      {
        status: 'success',
        title: '接口成功',
        data: { ...valueRef.current },
      },
    ];
  }, []);

  useEffect(() => {
    const param = cloneDeep(params);
    valueRef.current = cloneDeep(ctx.formModel.paramsList?.[0].data);
    merge(valueRef.current, param, ctx);
    updateValue();
    forceRender(Math.random());
  }, [params]);
  const set = useCallback((item, key, val) => {
    item[key] = val;
    updateValue();
  }, []);

  const processAry = useCallback((item, depth) => {
    return item.children.map((child: any) => {
      return processItem(child, item, depth);
    });
  }, []);

  const processItem = useCallback((item, parent, depth = -1) => {
    if (!item) return null;
    if (item.type === 'root' && !item.children) return null;
    let jsx;
    if (item.type === 'root') {
      item.name = '';
    }
    if (item.children) {
      jsx = processAry(item, depth + 1);
    }

    const isArrayParent = parent.type === 'array';
    const isObject = item.type === 'object';
    const isRoot = item.type === 'root';
    const isArray = item.type === 'array';
    const hide = isObject || isRoot || isArray;

    return (
      <div className={css.ct} key={item.id || 'root'}>
        <div className={`${css.item} ${isRoot ? css.rootItem : ''}`}>
          <div style={{ padding: '0 10px 0 2px' }}>
            {isArrayParent ? `[${item.name}]` : item.name}
            <span className={css.typeName}>({getTypeName(item.type)})</span>
          </div>
          {hide ? null : (
            <input
              className={css.column}
              type={'text'}
              disabled={item.type === 'object' || item.type === 'array'}
              defaultValue={item.defaultValue}
              onChange={(e) => set(item, 'defaultValue', e.target.value)}
            />
          )}
        </div>
        {jsx}
      </div>
    );
  }, []);

  return (
    <div className={css.debug}>
      <div className={css.content}>
        {valueRef.current?.children?.length
          ? processItem(
              { type: 'root', ...valueRef.current },
              { type: 'root', ...valueRef.current }
            )
          : null}
      </div>
      <Button onClick={onDebugClick} type='primary' style={{ marginTop: 12 }}>
        连接测试
      </Button>
    </div>
  );
}

function getTypeName(v: string) {
  switch (v) {
    case 'number':
      return '数字';
    case 'string':
      return '字符';
    case 'boolean':
      return '布尔';
    case 'object':
    case 'root':
      return '对象';
    case 'array':
      return '列表';
  }
}
