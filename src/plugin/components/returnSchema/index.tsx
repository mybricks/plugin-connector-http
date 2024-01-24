import React, { useRef, useState } from 'react';
import { useCallback } from 'react';
import { isEmpty } from '../../../utils/lodash';
import { MarkList, MarkTypeLabel, MarkTypes } from '../../../constant';
import { notice } from '../../../components';

import styles from './index.less';

export default function ReturnSchema({ mark, onMarkChange, schema, error, noMark, registerBlur }: any) {
  const parentEleRef = useRef<HTMLDivElement>();
  const curKeyRef = useRef('');
  const [popMenuStyle, setStyle] = useState<any>();
  const [curMarkList, setCurMarkList] = useState(MarkList);

  const markAsReturn = useCallback((type: string) => {
    const targetSchemaTypes = MarkTypes[type] || [];
    let keys = curKeyRef.current?.split('.') || [];
    let originSchema = schema;
    while (keys.length && originSchema) {
      const key = keys.shift();
      originSchema = originSchema.properties?.[key] || originSchema.items?.properties?.[key];
    }

    if (!originSchema || !originSchema.type || keys.length) {
      notice(`【${MarkTypeLabel[type]}】所标识数据类型不存在`);
      return;
    }

    if (!targetSchemaTypes.includes('any') && (!targetSchemaTypes.includes(originSchema.type) || keys.length)) {
      notice(`【${MarkTypeLabel[type]}】所标识数据类型必须为 ${MarkTypes[type]?.map(key => getTypeName(key)).join('、')}`);
      return;
    }

    if (type === 'predicate') {
      const predicate: Record<string, unknown> = { key: curKeyRef.current, value: 1, operator: '=', type: 'success' };
      /** 设置标识值的默认值 */
      if (originSchema.type === 'boolean') {
        predicate.value = true;
      } else if (originSchema.type === 'string') {
        predicate.value = 'success';
      }

      onMarkChange({ ...mark, predicate });
    } else {
      let outputKeys = mark.outputKeys || [];
      let excludeKeys = mark.excludeKeys || [];

      if (!excludeKeys.some(key => key === curKeyRef.current)) {
        outputKeys = [
          ...outputKeys.filter(key => !(key.includes(curKeyRef.current) || curKeyRef.current.includes(key))),
          curKeyRef.current,
        ].filter(key => key !== '');
      }
      excludeKeys = excludeKeys.filter(key => key !== curKeyRef.current)
      onMarkChange({ ...mark, excludeKeys, outputKeys });
    }
  }, [mark, schema]);

  function proAry(items, xpath) {
    if (!items) return null;
    return proItem({ val: items, xpath });
  }

  function proObj(properties, xpath) {
    if (!properties) return null;
    return (
      <>
        {Object.keys(properties).map((key) => {
          const nXPath =
            xpath !== void 0 ? (xpath ? `${xpath}.${key}` : key) : void 0;
          return proItem({ val: properties[key], xpath: nXPath, key });
        })}
      </>
    );
  }

  function proItem({ val, key, xpath, root }: { val; key?; xpath?; root? }) {
    let jsx;
    if (val.type === 'array') {
      jsx = proAry(val.items, xpath);
    } else {
      if (val.type === 'object') {
        jsx = proObj(val.properties, xpath);
      }
    }

    const hasReturnSchema = !isEmpty(mark?.outputKeys);
    const markedAsReturn = (!hasReturnSchema && root) || (key && hasReturnSchema && mark?.outputKeys?.includes(xpath));
    const markedAsPredicate = mark?.predicate?.key === xpath;

    const showMark =
      xpath !== void 0 &&
      !mark?.excludeKeys.some((key) => xpath.startsWith(key) && key !== xpath);

    const showCancel =
      (
        key !== void 0 &&
        ((markedAsReturn && !root) ||
          ((mark?.outputKeys.some((key: string) => xpath?.startsWith(key)) || !hasReturnSchema) &&
            !mark?.excludeKeys.some((key) => xpath.startsWith(key))))
      ) || markedAsPredicate;

    const onChangeValue = value => onMarkChange({ ...mark, predicate: { ...mark.predicate, value } });
    const onChangeOperator = e => onMarkChange({ ...mark, predicate: { ...mark.predicate, operator: e.target.value } });
    const onChangeType = e => onMarkChange({ ...mark, predicate: { ...mark.predicate, type: e.target.value } });

    return (
      <div key={key} className={`${styles.item} ${root ? styles.rootItem : ''} ${(markedAsReturn || markedAsPredicate) ? styles.markAsReturn : ''}`}>
        {(markedAsReturn || markedAsPredicate) ? (
          <div
            className={styles.marked}
            data-content={markedAsPredicate ? (markedAsReturn ? '生效标识、返回内容' : '生效标识') : '返回内容'}
          />
        ) : null}
        {mark?.excludeKeys.includes(xpath) && key ? (
          <div className={styles.exclude}></div>
        ) : null}
        <div className={styles.keyName}>
          {key}
          <span className={styles.typeName}>({getTypeName(val.type)})</span>
          {showMark && key && !noMark ? (
            <button
              onClick={(e) => {
                popMark(e, xpath);
                e.stopPropagation();
              }}
            >
              标记
            </button>
          ) : null}
          {markedAsPredicate && !noMark ? (
            <>
              <span style={{ marginLeft: '10px' }}>当值</span>
              <select value={mark?.predicate?.operator} className={styles.markValueSelect} onChange={onChangeOperator}>
                <option value="=">等于</option>
                <option value="!=">不等于</option>
              </select>
              {val.type === 'string' ? (
                <input
                  value={mark?.predicate?.value}
                  className={styles.markValueInput}
                  type="text"
                  onChange={e => onChangeValue(e.target.value)}
                />
              ) : null}
              {val.type === 'number' ? (
                <input
                  value={Number(mark?.predicate?.value)}
                  className={styles.markValueInput}
                  type="number"
                  onChange={e => onChangeValue(Number(e.target.value))}
                />
              ) : null}
              {val.type === 'boolean' ? (
                <select
                  value={Number(mark?.predicate?.value)}
                  className={styles.markValueSelect}
                  onChange={e => onChangeValue(Boolean(Number(e.target.value)))}
                >
                  <option value={1}>true</option>
                  <option value={0}>false</option>
                </select>
              ) : null}
              <span style={{ marginLeft: 0 }}>时，即</span>
              <select
                value={mark?.predicate?.type || 'success'}
                className={styles.markValueSelect}
                onChange={e => onChangeType(e)}
              >
                <option value="success">请求成功</option>
                <option value="failed">请求失败</option>
              </select>
            </>
          ) : null}
          {showCancel && !noMark ? (
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
    let newMarkList = MarkList;
    let keys = curKeyRef.current?.split('.') || [];
    let originSchema = schema;

    while (keys.length && originSchema) {
      const key = keys.shift();
      originSchema = originSchema.properties?.[key] || originSchema.items?.properties?.[key];

      /** 数组中的值或对象类型的值不允许标记为标记组的标识 */
      if (originSchema?.type === 'array' || (!keys.length && originSchema?.type === 'object')) {
        newMarkList = MarkList.filter(m => m.key !== 'predicate');
        break;
      }
    }

    let top = currentPos.y - parentPos.y + btnEle.offsetHeight;
    /** 每一项高度为 28 */
    const popMenuHeight = 28 * newMarkList.length + 10;

    if (top + popMenuHeight > parentPos.height || currentPos.top + popMenuHeight > document.body.clientHeight) {
      top -= popMenuHeight + btnEle.offsetHeight;
    }
    setCurMarkList(newMarkList);
    setStyle({ display: 'block', left: currentPos.x - parentPos.x, top });
    registerBlur?.('return-schema', () => setStyle(void 0));
  }, [registerBlur]);

  const cancelMark = useCallback((e, xpath) => {
    /** 优先取消标记组标识 */
    if (mark.predicate?.key === xpath) {
      onMarkChange({ ...mark, predicate: {} });
      return;
    }
    const outputKeys = mark.outputKeys.filter(key => key !== xpath).filter(key => key !== '');
    let excludeKeys = mark.excludeKeys;
    if (!mark.outputKeys.some(key => key === xpath)) {
      excludeKeys = [...excludeKeys.filter(key => !(key.includes(xpath) || xpath.includes(key))), xpath];
    }

    onMarkChange({ ...mark, outputKeys, excludeKeys });
  }, [mark]);

  const resetPopMenuStyle = useCallback((event) => {
    setStyle(void 0);
    registerBlur('return-schema', () => {});
    event.stopPropagation();
  }, [registerBlur]);

  if (error) {
    const isErrorMessage = typeof error === 'string';
    const errorMessage = isErrorMessage ? error : (error?.message || '接口错误：无具体错误信息');
    return (
      <div className={styles.errorInfo}>
        <span>{errorMessage}</span>
        <div>{getErrorTips(errorMessage)}</div>
      </div>
    );
  }
  return schema ? (
    <div
      className={styles.returnParams}
      style={noMark ? { marginTop: 0 } : undefined}
      ref={parentEleRef}
      onClick={resetPopMenuStyle}
    >
      <div>{proItem({ val: schema, xpath: '', root: true })}</div>
      <div className={styles.popMenu} style={popMenuStyle}>
        {curMarkList.map(mark => {
          return (
            <div
              className={styles.menuItem}
              key={mark.key}
              onClick={() => markAsReturn(mark.key)}
              data-mybricks-tip={{ content: mark.description }}
            >
              {mark.title}
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className={styles.empty}>类型无效，请点击「连接测试」获取类型或手动编辑类型</div>
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
  if (message.includes?.('Network Error')) {
    return '请检查网络是否正常、当前请求是否存在跨域';
  }
  if (message.includes?.('404')) {
    return '请检查请求地址是否拼写错误';
  }
  return '';
}
