import css from "./Toolbar.less";
import {evt, observe} from '@mybricks/rxui'
import * as Icons from '../Icons'

import React, {useEffect, useRef} from "react";

import SVContext from "./SVContext";

export default function () {
  const myCtx = observe(SVContext, {from: 'parents'})

  const searchIpt = useRef<HTMLInputElement>()

  // useEffect(()=>{
  //   add(myCtx)
  // },[])

  return (
    <div className={css.toolbar}>
      <div className={css.search}>
        <input type={'text'} ref={searchIpt} placeholder={'请输入名称'}
               value={myCtx.searchText}
               onChange={e => myCtx.search(e.target.value)}/>
        {Icons.search}
      </div>
      <div className={`${css.add} ${myCtx.editNow?css.disable:''}`} onClick={evt(() => add(myCtx)).stop}>+</div>
    </div>
  )
}

async function add(myCtx: SVContext) {
  myCtx.editConnector({})
}