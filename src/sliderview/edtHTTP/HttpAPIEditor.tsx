import css from './HttpAPIEditor.less'
import {createPortal} from "react-dom";
import {clone, getPosition, observe, useObservable} from "@mybricks/rxui";
import SVContext from "../SVContext";
import {useCallback} from "react";
import RadioBtns from "../editors/RatioBtns";
import InputGroup from "../editors/InputGroup";
import Ctx from "./Ctx";
import ReturnDesc from "./ReturnDesc";

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
        <span>Web接口连接器</span>
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
          <label><i>*</i>名称</label>
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
          <label><i>*</i>地址</label>
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
          <label><i>*</i>请求方法</label>
          <div className={css.editor}>
            <RadioBtns binding={[ctx.data, 'method']} options={methodOpts}/>
          </div>
        </div>
        <div className={`${css.item} ${css.itemTop}`}>
          <label>请求参数</label>
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