/**
 * 使用树形选择器完成字段映射
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Tree, Tag, Spin, Tooltip } from 'antd';
import css from './index.less';
import { isEmpty } from '../../../utils/lodash';

const unknownType = '任意'

const typeMap: any = {
  array: '列表',
  object: '对象',
  number: '数字',
  string: '字符串',
  boolean: '布尔值',
  unknown: unknownType,
  undefined: unknownType,
  null: unknownType
};

function schema2Tree(
  schema: any = {},
  parentKey = '',
  list: any = [],
  config: any = {}
) {
  const { isRoot = false, useArray = true } = config;
  const { type } = schema;
  if (type !== 'object' && type !== 'array') return;
  const properties =
    type === 'object' ? schema.properties : schema.items.properties;
  Object.keys(properties).forEach((key) => {
    const subSchema = properties[key];
    const item: any = {};
    item.title = key;
    item.key = isRoot ? key : `${parentKey}.${key}`;
    item.type = subSchema.type;
    if (!useArray) {
      item.checkable = false;
    }
    list.push(item);
    if (subSchema.type === 'object') {
      item.children = [];
      schema2Tree(
        subSchema,
        isRoot ? key : `${parentKey}.${key}`,
        item.children,
        { useArray }
      );
    }
    if (subSchema.type === 'array') {
      item.children = [];
      schema2Tree(
        subSchema.items,
        isRoot ? key : `${parentKey}.${key}`,
        item.children,
        { useArray: false }
      );
    }
  });
}

export default function FieldSelect({
  value = [],
  onChange,
  schema,
  loading,
  error,
}: any) {
  const [currentKey, setKey] = useState('');
  const listRef = useRef([]);
 
  useMemo(() => {
    listRef.current = [];
    schema2Tree(schema, '', listRef.current, { isRoot: true });
  }, [schema])

  const onValueChange = useCallback(
    (fieldNames: string[], { node, checkedNodes }: any) => {
      setKey('');
      let newFields = fieldNames;
      if (node.checkAble === false) {
        node.checked = false;
        return;
      }

      if (fieldNames.length === 0) {
        setKey(node.key);
        setTimeout(() => {
          setKey('');
        }, 2500);
      }

      checkedNodes.forEach((node: any) => {
        if (
          node.type === 'object' &&
          node.children?.length &&
          node.children?.every((child: any) =>
            newFields.some((key) => key === child.key)
          )
        ) {
          newFields = newFields.filter((key) => key !== node.key);
        }
      });
      onChange(newFields);
    },
    []
  );

  const titleRender = (node: any) => {
    return (
      <Tooltip
        key={node.key}
        overlayClassName={css.tooltip}
        title='未勾选字段时，将返回全部数据'
        color='#FF4907'
        visible={node.key === currentKey}
        placement='right'
      >
        <div style={{ width: 'fit-content' }}>
          <span className={css.gap}>{node.title}</span>
          <Tag>{typeMap[node.type]}</Tag>
        </div>
      </Tooltip>
    );
  };

  const renderBody = () => {
    if (error) {
      return (
        <div className={css.empty}>
          <span>{error.message || error}</span>
        </div>
      );
    }
    if (isEmpty(schema)) {
      return (
        <div className={css.empty}>
          <span>暂无数据，请点击连接测试</span>
        </div>
      );
    }

    return (
      <Tree
        key={schema}
        className={css.tree}
        showLine={{ showLeafIcon: false }}
        showIcon={false}
        defaultExpandAll
        onCheck={onValueChange}
        checkedKeys={value}
        allowClear
        checkable
        blockNode
        selectable={false}
        treeData={listRef.current}
        titleRender={titleRender}
        style={{ width: '100%', overflow: 'scroll' }}
      />
    );
  };

  return <Spin spinning={loading}>{renderBody()}</Spin>;
}
