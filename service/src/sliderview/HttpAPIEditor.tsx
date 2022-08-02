import css from './HttpAPIEditor.less'
import {createPortal} from "react-dom";
import {clone, getPosition, observe, useObservable, uuid} from "@mybricks/rxui";
import SVContext from "./SVContext";
import {useCallback} from "react";
import RadioBtns from "./editors/RatioBtns";
import InputGroup from "./editors/InputGroup";
import ReturnShema from "./editors/ReturnShema";

import jsonToSchema from '../utils/jsonToSchema'
import {T_Connector} from "../types";
import {formatDate} from "../utils/formatDate";


class Ctx {
  data: T_Connector

  titleErr

  urlErr

  returnErr

  getScript(filter?: boolean) {////TODO 现有问题修复
    return `
      function(params,{then,onError},{ajax}){
          ajax({url:'${this.data.url}',method:'${this.data.method}',params:params})
          .then(function(response) {
            var xpathForReturn = '${(filter === void 0 || filter) ? (this.data.returnSchema?._markAsReturn || '') : ''}'
            if(xpathForReturn!==''){
              if(response&&typeof response==='object'){
                try{
                  var xpathAry = xpathForReturn.split('/'),tobj = response
                  for(var ti=0;ti<xpathAry.length;ti++){
                    if(xpathAry[ti]!==''){
                      tobj = tobj[xpathAry[ti]]
                    }
                  }
                  then(tobj)
                }catch(ex){
                  onError(new Error('根据标记处理返回的数据错误:'+ex.message));
                }
              }else{
                onError(new Error('返回的数据类型不匹配'));
              }
            }else{
              then(response)
            }
          }).catch(function(err){
            onError(err);
          })
      }
    `
  }

  constructor() {
    this.data = {
      id: uuid('s_', 3),
      method: 'GET',
      paramAry: [],
      returnSchema: {}
    } as any
  }

  assetUrl() {
    this.urlErr = void 0
    if (!this.data.url || !this.data.url.match(/^https?:\/\//gi)) {
      this.urlErr = `地址为空或格式错误`
      return false
    }

    return true
  }

  validate() {
    this.reset()

    if (!this.data.title || this.data.title === '') {
      this.titleErr = `标题为空`
    }

    this.assetUrl()

    if (!this.data.returnSchema.fact) {
      this.returnErr = `返回内容为空`
    }

    return this.titleErr || this.urlErr || this.returnErr
  }

  reset() {
    this.titleErr = void 0
    this.urlErr = void 0
    this.titleErr = void 0
  }
}

export default function HttpAPIEditor() {
  const myCtx = observe(SVContext, {from: 'parents'})
  const editNow = myCtx.editNow

  const ctx = useObservable(Ctx,
    next => {
      if (editNow && editNow.id) {
        next({data: clone(editNow)})
      } else {
        next(new Ctx())
      }
    }, {
      to: 'children'
    }, [editNow])

  const save = useCallback(() => {
    const errorMsg = ctx.validate()
    if (errorMsg) {
      return
    }

    const script = ctx.getScript()

    myCtx.saveConnector({...ctx.data, script})

    myCtx.editClose()
  }, [])

  const cancel = useCallback(() => {
    myCtx.editClose()
  }, [])

  const methodOpts = [
    {title: 'GET', value: 'GET'},
    {title: 'POST', value: 'POST'}
  ]

  const panelClick = useCallback(() => {
    myCtx.blur()
  }, [])

  const po = getPosition(myCtx.panelDom)

  return createPortal(
    <div className={css.panel}
         style={{left: po.x + po.w, top: po.y, height: po.h}}
         onClick={panelClick}>
      <div className={css.titleBar}>
        <span>{ctx.data.title || ''}</span>
        <div className={css.btns}>
          <button onClick={save} className={css.primary}>保存</button>
          <button onClick={cancel}>取消</button>
        </div>
      </div>
      <div className={css.cfgPanel}>
        {/*<div className={css.item}>*/}
        {/*  <label><i>*</i>标识:</label>*/}
        {/*  <div className={css.editor}>*/}
        {/*    <input type={'text'}*/}
        {/*           readOnly={true}*/}
        {/*           value={ctx.id}*/}
        {/*           onChange={e => {*/}
        {/*             ctx.id = e.target.value*/}
        {/*           }}/>*/}
        {/*  </div>*/}
        {/*</div>*/}
        <div className={css.item}>
          <label><i>*</i>名称:</label>
          <div className={`${css.editor} ${css.textEdt} ${ctx.titleErr ? css.error : ''}`} data-err={ctx.titleErr}>
            <input type={'text'}
                   placeholder={'服务接口的标题'}
                   value={ctx.data.title}
                   onChange={e => {
                     ctx.titleErr = void 0
                     ctx.data.title = e.target.value
                   }}/>
          </div>
        </div>
        <div className={css.item}>
          <label><i>*</i>地址:</label>
          <div className={`${css.editor} ${css.textEdt} ${ctx.urlErr ? css.error : ''}`} data-err={ctx.urlErr}>
        <textarea value={ctx.data.url}
                  placeholder={'接口的完整地址，以http://或https://开始'}
                  onChange={e => {
                    ctx.urlErr = void 0
                    ctx.data.url = e.target.value
                    ctx.data.returnSchema.fact = void 0//clear it
                  }}/>
          </div>
        </div>
        <div className={css.sperator}></div>
        <div className={css.item}>
          <label><i>*</i>请求方法:</label>
          <div className={css.editor}>
            <RadioBtns binding={[ctx.data, 'method']} options={methodOpts}/>
          </div>
        </div>
        <div className={`${css.item} ${css.itemTop}`}>
          <label>请求参数:</label>
          <div className={css.editor}>
            <InputGroup itemAry={ctx.data.paramAry}/>
          </div>
        </div>
        <div className={css.sperator}></div>
        <ReturnDesc ctx={ctx}/>
      </div>
      {/*<Debugger ctx={ctx}/>*/}

    </div>, document.body
  )
}

function ReturnDesc({ctx}: { ctx: Ctx }) {
  const myCtx = observe(SVContext, {from: 'parents'})

  const runCtx = useObservable(class {
    response

    responseLogs: []
    //
    // err

    reset() {
      ctx.returnErr = void 0

      this.responseLogs = void 0
      this.response = ''
    }
  })

  const run = useCallback(() => {
    if (ctx.assetUrl()) {
      runCtx.reset()

      const logs = runCtx.responseLogs = []
      const pushLog = content => {
        logs.push(`[${formatDate(new Date(), 'mm-dd HH:MM:SS')}]  ${content}`)
      }

      pushLog('发起请求')

      myCtx.connector.test(ctx.getScript(false)).then(val => {
        let valStr
        try {
          if (val && typeof val === 'object') {
            valStr = JSON.stringify(val, null, 2)
          } else {
            valStr = String(val)
          }
        } catch (ex) {
          valStr = String(val)
        }

        runCtx.response = val
        pushLog(`返回结果 \n ${valStr}`)
        //runCtx.responseLogs = valStr

        return new Promise((resolve, reject) => {
          resolve(val)
        })
      }).catch(err => {
        ctx.data.returnSchema = {
          all: void 0,
          fact: void 0,
          _markAsReturn: ctx.data.returnSchema._markAsReturn
        }

        let valStr
        try {
          if (err && err instanceof Error) {
            valStr = err.message
          } else if (err && typeof err === 'object') {
            valStr = JSON.stringify(err, null, 4)
          } else {
            valStr = String(err)
          }
        } catch (ex) {
          valStr = String(err)
        }

        pushLog(`调用发生错误，结果 \n ${valStr}`)
      }).then(val => {
        try {
          ctx.data.returnSchema = {
            all: jsonToSchema(val),
            fact: void 0,
            _markAsReturn: ctx.data.returnSchema._markAsReturn
          }
        } catch (ex) {
          console.error(ex)

          pushLog(`调用发生错误，结果 \n ${ex.message}`)
        }
      })
    }
  }, [])

  if (!myCtx.editNow) {
    return
  }

  return (
    <>
      <div className={`${css.item} ${css.itemTop}`}>
        <label><i>*</i>返回数据:</label>
        <div className={`${css.returnDesc} ${ctx.returnErr ? css.returnDescErr : ''}`}
             data-err={ctx.returnErr}>
          <button onClick={run}>连接测试</button>
          <ReturnShema schema={ctx.data.returnSchema}/>
        </div>
      </div>
      {
        runCtx.responseLogs ? (
          <div className={css.response}>
            <div className={css.result}>
              <textarea readOnly={true} value={runCtx.responseLogs.join('\n')}/>
            </div>
          </div>
        ) : null
      }
    </>
  )
}

// function Debugger({ctx}: { ctx: Ctx }) {
//
//   return (
//     <div className={css.debugPanel}>
//       <div className={css.toolbar}>
//         <button onClick={run}>连接测试</button>
//       </div>
//       <div className={css.result}>
//         结果:
//         <textarea className={`${runCtx.err ? css.error : ''}`}
//                   readOnly={true} value={runCtx.val || runCtx.err}/>
//       </div>
//     </div>
//   )
// }