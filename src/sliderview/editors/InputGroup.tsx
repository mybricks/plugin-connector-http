import css from './InputGroup.less'
import {remove as IconRemove} from '../../Icons'
import {useCallback} from "react";
import {useObservable} from "@mybricks/rxui";

class MyCtx {
  curCount: number

  itemAry: {}[]

  set(item, key, val) {
    item[key] = val
  }
}

export default function InputGroup({itemAry}) {
  const ctx = useObservable(MyCtx, next => {
    next({itemAry, curCount: itemAry.length})
  })

  const addItem = useCallback(() => {
    ctx.curCount++
    ctx.itemAry.push({
      name: `name${ctx.curCount}`,
      type:'string',
      defaultValue: ''
    })
  }, [])

  const removeItem = useCallback((item) => {
    const idx = ctx.itemAry.indexOf(item)
    ctx.itemAry.splice(idx, 1)
  }, [])

  return (
    <div className={css.inputGroup}>
      {
        ctx.itemAry.map((item, idx) => {
          return (
            <div className={css.item} key={idx}>
              {/*<span className={css.label}>名称:</span>*/}
              <input type={'text'}
                     value={item.name}
                     onChange={e => ctx.set(item, 'name', e.target.value)}/>
              <span className={css.label}>类型:</span>
              <select value={item.type} onChange={e => ctx.set(item, 'type', e.target.value)}>
                <option label={'字符'} value={'string'}/>
                <option label={'数字'} value={'number'}/>
              </select>
              <span className={css.label}>默认值:</span>
              <input type={'text'}
                     value={item.defaultValue}
                     onChange={e => ctx.set(item, 'defaultValue', e.target.value)}/>
              <span className={css.iconRemove} onClick={e => removeItem(item)}>{IconRemove}</span>
              {idx == ctx.itemAry.length - 1 ? <span className={css.iconAdder} onClick={addItem}>+</span> : null}
            </div>
          )
        })
      }
      {
        ctx.itemAry.length <= 0 ? (
          <div className={css.adder}>
            <span onClick={addItem}>+</span>
          </div>
        ) : null
      }
    </div>
  )
}