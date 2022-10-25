import Ctx from "./Ctx";
import {observe, useObservable} from "@mybricks/rxui";
import SVContext from "../SVContext";
import {formatDate} from "../../utils/formatDate";
import jsonToSchema from "../../utils/jsonToSchema";
import edtCss from './HttpAPIEditor.less'
import css from "./ReturnDesc.less";
import ReturnShema from "../editors/ReturnShema";
import {useCallback, useRef} from "react";
import InputGroup from "../editors/InputGroup";

class RCtx {
  ctx: Ctx

  params: {} = {}

  response

  responseLogs: { type: 'info' | 'error', content: string }[]

  reset() {
    this.ctx.returnErr = void 0

    this.responseLogs = void 0
    this.response = ''
  }
}

export default function ReturnDesc({ctx}: { ctx: Ctx }) {
  const myCtx = observe(SVContext, {from: 'parents'})

  const runCtx = useObservable(RCtx, next => {
    next({
      ctx
    })
  })

  const paramsRef = useRef<HTMLDivElement>()

  const run = useCallback(() => {
    if (ctx.assetUrl()) {
      runCtx.reset()

      const logs = runCtx.responseLogs = []
      const pushLog = (content, type?) => {
        logs.push({
          type: type || 'info',
          content: `[${formatDate(new Date(), 'mm-dd HH:MM:SS')}] ${content.replace(/\\n/gi, '<br/>')}`
        })
      }

      pushLog('发起请求')

      let params
      if (paramsRef.current) {
        const ipts = paramsRef.current.querySelectorAll('input[type=text]')
        if (ipts) {
          params = {}
          for (let i = 0; i < ipts.length; i++) {
            const ipt = ipts[i]
            params[ipt.getAttribute('name')] = ipt.value
          }
        }
      }

      myCtx.connector.test(ctx.getScript(false), params).then(val => {
        let valStr
        try {
          if (val && typeof val === 'object') {
            valStr = JSON.stringify(val, null, 2).replaceAll(`\n`, '<br/>')
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

        pushLog(`调用发生错误，结果 \n ${valStr}`, 'error')
      }).then(val => {
        try {
          ctx.data.returnSchema = {
            all: jsonToSchema(val),
            fact: void 0,
            _markAsReturn: ctx.data.returnSchema._markAsReturn
          }
        } catch (ex) {
          console.error(ex)

          pushLog(`调用发生错误，结果 \n ${ex.message}`, 'error')
        }
      })
    }
  }, [])

  if (!myCtx.editNow) {
    return
  }

  return (
    <>
      <div className={`${edtCss.item} ${edtCss.itemTop}`}>
        {/*<label><i>*</i>返回数据:</label>*/}
        <div className={`${css.returnDesc} ${ctx.returnErr ? css.returnDescErr : ''}`}
             data-err={ctx.returnErr}>
          <div className={css.req}>
            <div className={css.params}>
              {
                ctx.data.paramAry ? ctx.data.paramAry.map(param => {
                  return (
                    <div className={css.param} ref={paramsRef}>
                      <label>{param.name}</label>
                      <input type={'text'}
                             placeholder={'请求参数'}
                             name={param.name}
                             defaultValue={param.defaultValue}/>
                    </div>
                  )
                }) : null
              }
            </div>
            <button onClick={run}>测试接口</button>
          </div>
          <ReturnShema schema={ctx.data.returnSchema}/>
        </div>
      </div>
      {
        runCtx.responseLogs ? (
          <div className={css.response}>
            <div className={css.result}>
              {
                runCtx.responseLogs.map((log, idx) => {
                  return (
                    <div key={idx} className={log.type === 'error' ? css.logErr : css.logInfo}
                         dangerouslySetInnerHTML={{__html: log.content}}>
                      {/*{log.content}*/}
                    </div>
                  )
                })
              }
              {/*<textarea readOnly={true} value={runCtx.responseLogs.join('\n')}/>*/}
            </div>
          </div>
        ) : null
      }
    </>
  )
}