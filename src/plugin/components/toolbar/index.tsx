import React from 'react';
import { plus } from '../../../icon'
import Dropdown from '../../../components/Dropdown';
import { SEPARATOR_TYPE, SERVICE_TYPE } from '../../../constant';

import css from './index.less';

export default function ({ ctx, setRender, blurMap }: any) {
  const onAddClick = async (type = 'http') => {
	  ctx.type = type;
	  ctx.activeId = void 0;
	  ctx.isEdit = false;
	  ctx.parent = null;
	  ctx.formModel = { type };
	  setRender(ctx);
			
		if (type === SERVICE_TYPE.HTTP) {
			ctx.addDefaultService();
		} else if (type === SERVICE_TYPE.FOLDER) {
			ctx.addServiceFolder();
		} else if(type === SERVICE_TYPE.IMPORT) {
			ctx.importService()
		} else if (type === SERVICE_TYPE.JS) {
			ctx.addDefaultJs();
		}
  };

  const renderAddActionList = () => {
	  const menu = (
		  <div className={css.ct}>
			  {ctx.addActions.map(({ type, title }: any) => (
				 type === SEPARATOR_TYPE ? <div className={css['separator-divider']}></div>: <div className={css.item} onClick={() => onAddClick(type)} key={type}>{title}</div>
			  ))}
		  </div>
	  );
	
	  return (
		  <Dropdown dropDownStyle={ctx.type ? { right: 0 } : undefined} onBlur={fn => blurMap['toolbar'] = fn} overlay={menu}>
			  <div className={css.icon} data-mybricks-tip="创建连接器" onClick={() => Object.keys(blurMap).filter(key => key !== 'toolbar').forEach(key => blurMap[key]())}>
				  {plus}
			  </div>
		  </Dropdown>
	  );
  };

  return (
    <div className={css.toolbar}>
      <div className={css.search}>
        <input
          type={'text'}
          placeholder={'请输入名称搜索服务接口'}
          onChange={(e) => ctx.search(e.target.value)}
        />
      </div>
      {renderAddActionList()}
    </div>
  );
}
