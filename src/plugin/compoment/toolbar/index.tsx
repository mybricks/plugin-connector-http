import css from './index.less';
import { plus } from '../../../icon'
import React, { useCallback } from 'react';
import {
  KDEV_PANEL_VISIBLE,
  TG_PANEL_VISIBLE,
} from '../../../constant';
import { Dropdown, Input, Menu } from 'antd';

const { Search } = Input;

export default function ({ ctx }: any) {
  const onAddClick = useCallback(async ({ key } = {}) => {
    ctx.type = key;
    ctx.activeId = void 0;
    ctx.isEdit = false;
    ctx.templateVisible = false;
    ctx.formModel = { type: key };
    switch (key) {
      case 'kdev':
        ctx.panelVisible = KDEV_PANEL_VISIBLE;
        break;

      case 'tg':
        ctx.panelVisible = TG_PANEL_VISIBLE;
        break;

      default:
        ctx.addDefaultService();
    }
  }, []);

  const renderAddActionList = useCallback(() => {
    if (!ctx.addActions || ctx.addActions.length === 1) {
      return (
        <div className={css.icon} onClick={onAddClick}>
          {plus}
        </div>
      );
    }
    const menu = (
      <Menu onClick={onAddClick}>
        {ctx.addActions.map(({ type, title }: any) => (
          <Menu.Item key={type}>{title}</Menu.Item>
        ))}
      </Menu>
    );

    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <div className={css.icon}>
          {plus}
        </div>
      </Dropdown>
    );
  }, []);

  return (
    <div className={css.toolbar}>
      <div className={css.search}>
        <input
          type={'text'}
          placeholder={'请输入名称搜索服务接口'}
          value={ctx.searchText}
          onChange={(e) => ctx.search(e.target.value)}
        />
      </div>
      {renderAddActionList()}
    </div>
  );
}
