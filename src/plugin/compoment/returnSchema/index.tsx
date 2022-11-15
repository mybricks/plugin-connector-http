import css from './index.less';
import React, { useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';
import { isEmpty } from '../../../utils/lodash';

const emptyAry: any[] = [];

export default function ReturnShema({ value, onChange, schema, error }: any) {
  const parentEleRef = useRef();
  const curKeyRef = useRef('');
  const [keys, setKeys] = useState(value || emptyAry);
  const [popMenuStyle, setStyle] = useState<any>();

  useEffect(() => {
    setKeys(value || emptyAry);
  }, [value]);

  const markAsReturn = useCallback(() => {
    setKeys((keys: any[]) => {
      const outputkeys = [
        ...keys.filter(
          (key: string) =>
            !(
              key.includes(curKeyRef.current) || curKeyRef.current.includes(key)
            )
        ),
        curKeyRef.current,
      ].filter((key) => key !== '');
      onChange([...outputkeys]);
      return outputkeys;
    });
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

    const hasReturnSchema = !isEmpty(keys);
    const markedAsReturn =
      (!hasReturnSchema && root) || (hasReturnSchema && keys?.includes(xpath));

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
            <button
              onClick={(e) => {
                popMark(e, xpath);
                e.stopPropagation();
              }}
            >
              标记
            </button>
          ) : null}
          {markedAsReturn && !root ? (
            <button
              onClick={(e) => {
                cancelMark(e, xpath);
                e.stopPropagation();
              }}
            >
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
    const parentPos = parentEleRef.current.getBoundingClientRect();
    const currentPos = btnEle.getBoundingClientRect();
    curKeyRef.current = xpath;
    setStyle({
      display: 'block',
      left: currentPos.x - parentPos.x,
      top: currentPos.y - parentPos.y + btnEle.offsetHeight,
    });
  }, []);

  const cancelMark = useCallback((e, xpath) => {
    setKeys((keys: any[]) => {
      const outputkeys = [
        ...keys.filter((key: string) => key !== xpath),
      ].filter((key) => key !== '');
      onChange(outputkeys);
      return outputkeys;
    });
  }, []);

  const resetPopMenuStyle = useCallback(() => {
    setStyle(void 0);
  }, []);

  if (error) {
    return (
      <div className={css.errorInfo}>
        <span>{error}</span>
        <div>{getErrorTips(error)}</div>
      </div>
    );
  }
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

function getErrorTips(message: string) {
  if (message.includes('Network Error')) {
    return '请检查网络是否正常、当前请求是否存在跨域';
  }
  if (message.includes('404')) {
    return '请检查请求地址是否拼写错误';
  }
  return '';
}
