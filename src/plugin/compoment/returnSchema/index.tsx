import css from './index.less';
import React, { useRef, useState } from 'react';
import { evt, getPosition } from '@mybricks/rxui';
import { useCallback } from 'react';
import { isEmpty } from '../../../utils/lodash';

export default function ReturnShema({ value, onChange, schema }: any) {
  const parentEleRef = useRef();
  const keysRef = useRef(value || []);
  const [popMenuStyle, setStyle] = useState<any>();

  const markAsReturn = useCallback(() => {
    onChange([...keysRef.current]);
  }, []);

  function proAry(items) {
    if (!items) return null;
    return proItem({ val: items });
  }

  function proObj(properties, xpath) {
    if (!properties) return null;
    return (
      <>
        {Object.keys(properties).map((key) => {
          const nxpath =
            xpath !== void 0 ? (xpath ? `${xpath}.${key}` : key) : void 0;
          return proItem({ val: properties[key], xpath: nxpath, key });
        })}
      </>
    );
  }

  function proItem({ val, key, xpath, root }: { val; key?; xpath?; root? }) {
    let jsx;
    if (val.type === 'array') {
      jsx = proAry(val.items);
    } else {
      if (val.type === 'object') {
        jsx = proObj(val.properties, xpath);
      }
    }

    const hasReturnSchema = !isEmpty(value);
    const markedAsReturn =
      (!hasReturnSchema && root) || (hasReturnSchema && value?.includes(xpath));

    return (
      <div
        key={key}
        className={`${css.item} ${root ? css.rootItem : ''} ${
          markedAsReturn ? css.markAsReturn : ''
        }`}
      >
        {markedAsReturn ? <div className={css.marked}></div> : null}
        <div className={css.keyName}>
          {key}
          <span className={css.typeName}>({getTypeName(val.type)})</span>
          {xpath !== void 0 ? (
            <button onClick={evt((e: any) => popMark(e, xpath)).stop}>
              标记
            </button>
          ) : null}
          {markedAsReturn ? (
            <button onClick={evt((e: any) => cancelMark(e, xpath)).stop}>
              取消
            </button>
          ) : null}
        </div>
        {jsx}
      </div>
    );
  }

  const popMark = useCallback((e, xpath) => {
    const btnEle = e.currentTarget;
    const po = getPosition(btnEle, parentEleRef.current);
    keysRef.current = [
      ...keysRef.current.filter(
        (key: string) => !(key.includes(xpath) || xpath.includes(key))
      ),
      xpath,
    ];
    setStyle({
      display: 'block',
      left: po.x,
      top: po.y + btnEle.offsetHeight,
    });
  }, []);

  const cancelMark = useCallback((e, xpath) => {
    keysRef.current = [
      ...keysRef.current.filter((key: string) => key !== xpath),
    ];
    markAsReturn()
  }, []);

  const resetPopMenuStyle = useCallback(() => {
    setStyle(void 0);
  }, []);

  return schema ? (
    <div
      className={css.returnParams}
      ref={parentEleRef}
      onClick={resetPopMenuStyle}
    >
      <div>{proItem({ val: schema, xpath: '', root: true })}</div>
      <div className={css.popMenu} style={popMenuStyle}>
        <div className={css.menuItem} onClick={() => markAsReturn()}>
          返回内容
        </div>
        {/*<div className={css.menuItem}>错误判断</div>*/}
        {/*<div className={css.menuItem}>错误信息</div>*/}
      </div>
    </div>
  ) : (
    <div className={css.empty}>类型无效</div>
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
      return '对象';
    case 'array':
      return '列表';
  }
}
