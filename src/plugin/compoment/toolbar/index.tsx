import { plus } from '../../../icon'
import React from 'react';
import {
	DOMAIN_PANEL_VISIBLE,
	KDEV_PANEL_VISIBLE, SQL_PANEL_VISIBLE,
	TG_PANEL_VISIBLE,
} from '../../../constant';
import Dropdown from '../../../components/Dropdown';

import css from './index.less';

export default function ({ ctx, setRender, blurMap }: any) {
  const onAddClick = async (type = 'http') => {
	  ctx.type = type;
	  ctx.activeId = void 0;
	  ctx.isEdit = false;
	  ctx.templateVisible = false;
	  ctx.formModel = { type };
	  switch (type) {
		  case 'http-kdev':
			  ctx.panelVisible = KDEV_PANEL_VISIBLE;
			  setRender(ctx);
			  break;
		
		  case 'http-tg':
			  ctx.panelVisible = TG_PANEL_VISIBLE;
			  setRender(ctx);
			  break;
		
		  case 'http-sql':
			  ctx.panelVisible = SQL_PANEL_VISIBLE;
			  setRender(ctx);
			  break;
		  case 'domain':
			  ctx.panelVisible = DOMAIN_PANEL_VISIBLE;
			  setRender(ctx);
			  break;
		  default:
			  setRender(ctx);
			  ctx.addDefaultService();
	  }
  };

  const renderAddActionList = () => {
	  if (!ctx.addActions || ctx.addActions.length === 1) {
		  return (
			  <div className={css.icon} onClick={() => onAddClick('http')}>
				  {plus}
			  </div>
		  );
	  }
	  const menu = (
		  <div className={css.ct}>
			  {ctx.addActions.map(({ type, title }: any) => (
				  <div className={css.item} onClick={() => onAddClick(type)} key={type}>{title}</div>
			  ))}
		  </div>
	  );
	
	  return (
		  <Dropdown dropDownStyle={(ctx.templateVisible || ctx.panelVisible) ? { right: 0 } : undefined} onBlur={fn => blurMap['toolbar'] = fn} overlay={menu}>
			  <div className={css.icon}>
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
