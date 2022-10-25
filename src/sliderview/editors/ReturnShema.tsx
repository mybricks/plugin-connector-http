import css from './ReturnShema.less'
import {evt, getPosition, IgnoreObservable, observe, useObservable} from "@mybricks/rxui";
import {useCallback} from "react";
import SVContext from "../SVContext";
import {T_ReturnSchema} from "../../types";

class MyCtx {
  panelEle: HTMLElement

  popMarkMenuStyle

  schema: T_ReturnSchema

  markAsReturnIsValid: boolean

  _curXPath: string

  setCurXPath(xpath: string) {
    this._curXPath = xpath

    const [markAsReturnIsValid, validSchema] = validateSchema(this.schema.all, xpath)
    this.schema.fact = validSchema
  }

  setEle(el) {
    if (el) {
      this.panelEle = el
    }
  }

  blurPop() {
    this.popMarkMenuStyle = void 0
  }

  markAsReturn() {
    this.schema._markAsReturn = this._curXPath
  }
}

function validateSchema(allSchema, markAsReturn) {
  let markAsReturnIsValid = false

  if (markAsReturn) {
    const xpathAry = markAsReturn.split('/')
    let tSchema = allSchema
    for (var ti = 0; ti < xpathAry.length; ti++) {
      if (xpathAry[ti] !== '') {
        const props = tSchema.properties//object type
        if (props) {
          tSchema = props[xpathAry[ti]]
          if (!tSchema) {
            markAsReturnIsValid = true
          }
        } else {
          markAsReturnIsValid = true
        }
      }
    }

    return [markAsReturnIsValid, !markAsReturnIsValid ? tSchema : void 0]
  } else {
    return [markAsReturnIsValid, allSchema]
  }
}

export default function ReturnShema({schema}: { schema: T_ReturnSchema }) {
  const cvCtx = observe(SVContext, {from: 'parents'})

  const ctx = useObservable(MyCtx, next => {
    let markAsReturnIsValid: boolean = false
    let allSchema = schema.all

    if (allSchema) {
      const [markAsReturnIsValid, validSchema] = validateSchema(allSchema, schema._markAsReturn)
      if (validSchema) {
        schema.fact = validSchema
      }
    }

    next({
      markAsReturnIsValid,
      schema
    })
  }, [schema])

  function proAry(items) {
    return proItem({val: items})
  }

  function proObj(properties, xpath) {
    return (
      <>
        {
          Object.keys(properties).map(key => {
            const nxpath = xpath !== void 0 ? `${xpath}/${key}` : void 0
            return proItem({val: properties[key], xpath: nxpath, key})
          })
        }
      </>
    )
  }

  function proItem({val, key, xpath, root}: { val, key?, xpath?, root? }) {
    let jsx
    if (val.type === 'array') {
      jsx = proAry(val.items)
    } else {
      if (val.type === 'object') {
        jsx = proObj(val.properties, xpath)
      }
    }

    const markAsReturn = ctx.schema._markAsReturn
    const markedAsReturn = !markAsReturn && root || markAsReturn && markAsReturn === xpath

    return (
      <div key={key} className={`${css.item} ${root ? css.rootItem : ''} ${markedAsReturn ? css.markAsReturn : ''}`}>
        {markedAsReturn ? <div className={css.marked}></div> : null}
        <div className={css.keyName}>
          {key}<span className={css.typeName}>({getTypeName(val.type)})</span>
          {
            xpath !== void 0 ?
              <button onClick={evt(e => popMark(e, xpath)).stop}>
                标记
              </button> :
              val.type === 'unknown' ? (
                <button onClick={evt(e => repairType(val)).stop}>
                  补充为字符类型
                </button>
              ) : null

          }
        </div>
        {jsx}
      </div>
    )
  }

  const popMark = useCallback((e, xpath) => {
    const btnEle = e.currentTarget
    const po = getPosition(btnEle, ctx.panelEle)

    ctx.setCurXPath(xpath)

    ctx.popMarkMenuStyle = {
      display: 'block',
      left: po.x,
      top: po.y + btnEle.offsetHeight
    }

    cvCtx.regBlurFn(() => {
      ctx.popMarkMenuStyle = void 0
    })
  }, [])

  const repairType = useCallback((val)=>{
    val.type='string'
  },[])

  return ctx.schema.all ? (
    <div className={css.returnParams} ref={ctx.setEle} onClick={ctx.blurPop}>
      <div>
        {proItem({val: ctx.schema.all, xpath: '', root: true})}
      </div>
      <div className={css.popMenu} style={ctx.popMarkMenuStyle}>
        <div className={css.menuItem} onClick={ctx.markAsReturn}>返回内容</div>
        {/*<div className={css.menuItem}>判断是否成功</div>*/}
        {/*<div className={css.menuItem}>错误信息</div>*/}
      </div>
      <div className={css.popMenu} style={ctx.popMarkMenuStyle}>
        <div className={css.menuItem} onClick={ctx.markAsReturn}>返回内容</div>
        {/*<div className={css.menuItem}>判断是否成功</div>*/}
        {/*<div className={css.menuItem}>错误信息</div>*/}
      </div>
    </div>
  ) : (
    <div className={css.empty}>
      类型无效
    </div>
  )
}

function getTypeName(v) {
  switch (v) {
    case "number":
      return '数字'
    case "string":
      return '字符'
    case "boolean":
      return '布尔'
    case "object":
      return '对象'
    case "array":
      return '列表'
  }
}

// function toSchemaHtml(properties) {
//   return JSON.stringify(properties, null, 4)
//     .replace(/\n/gi, '<br/>').replace(/\s/gi, '&nbsp;')
// }