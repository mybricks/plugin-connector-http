import css from './MainView.less'
import {evt, useComputed, useObservable} from "@mybricks/rxui";
import SVContext from "./SVContext";
import Toolbar from "./Toolbar";
import HttpAPIEditor from "./edtHTTP/HttpAPIEditor";
import * as Icons from '../Icons'
import {useCallback, useEffect, useLayoutEffect} from "react";

export default function ({data, connector}) {
  const svContext = useObservable(SVContext, next => next({data, connector}), {to: 'children'})

  const toggleItem = useCallback((def) => {
    def.toggle = !def.toggle
  }, [])

  const remove = useCallback((def) => {
    if (confirm('确定要删除该服务连接吗?')) {
      svContext.removeConnector(def.id)
    }
  }, [])

  const itemsJsx = useComputed(() => {
    const items = data.connectors
    if (items.length > 0) {
      const jsx = []
      items.forEach(def => {
        jsx.push(
          <div key={def.id}
               className={`${css.connector} ${def.toggle ? css.toggle : ''} ${svContext.editNow === def ? css.editing : ''}`}
               onClick={e => toggleItem(def)}>
            <span className={css.arrow}>
              {Icons.arrowR}
            </span>
            <div className={css.tt}>
              {def.title}<label>({def.id})</label>
            </div>
            {
              svContext.editNow !== def ? (
                <>
                  <div className={`${css.icon}`}
                       onClick={evt(e => svContext.editConnector(def)).stop}>
                    {Icons.edit}
                  </div>
                  <div className={css.icon}
                       onClick={evt(e => remove(def)).stop}>
                    {Icons.remove}
                  </div>
                </>
              ) : null
            }
          </div>
        )
        if (def.toggle) {
          jsx.push(
            <div key={def.id + '-d'} className={css.detail}>
              <div className={css.item}>
                <label>标识:</label>
                <p>
                  {def.id}
                </p>
              </div>
              <div className={css.item}>
                <label>标题:</label>
                <p>
                  {def.title}
                </p>
              </div>
              <div className={css.item}>
                <label>地址:</label>
                <p>{def.url}</p>
              </div>
            </div>
          )
        }
      })
      return jsx
    }
  })

  // useEffect(() => {
  //   svContext.editConnector(data.connectors[1])////TODO
  // }, [])

  const panelClick = useCallback(() => {
    svContext.blur()
  }, [])

  return (
    <>
      <div className={css.view} ref={e => e && (svContext.panelDom = e)}
           onClick={panelClick}>
        <div className={css.titleBar}>
          <div className={css.tt}>
            服务连接
          </div>
        </div>
        <div className={svContext.editNow ? css.disable : ''}>
          <Toolbar/>
          <div className={css.connectors}>
            {
              itemsJsx
            }
          </div>
        </div>
      </div>
      {
        svContext.editNow ? <HttpAPIEditor/> : null
      }

    </>
  )
}