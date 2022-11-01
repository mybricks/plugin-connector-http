import React from 'react';
import ReactDOM from  'react-dom';
import css from '../../../../src/style-cssModules.less';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import Editor from '@mybricks/code-editor';

export default function GlobalPanel({ sidebarContext, closeTemplateForm, style }) {
  return (
    ReactDOM.createPortal(
      <div
        style={{
          left: 361,
          ...style
        }}
        className={`${css['sidebar-panel-edit']} ${
          sidebarContext.templateVisible
            ? css['sidebar-panel-edit-open']
            : ''
        }`}
      >
        <div className={css['sidebar-panel-title']}>
          <div>编辑全局配置</div>
          <div>
            <div className={css['actions']}>
              <Button
                size='small'
                onClick={() => closeTemplateForm()}
              >
                关 闭
              </Button>
            </div>
          </div>
        </div>
        <div className={css['sidebar-panel-content']}>
          <Collapse header='请求参数处理函数'>
            <Editor
              width='100%'
              height='260px'
              language='javascript'
              theme='light'
              lineNumbers='off'
              scrollbar={{
                horizontalScrollbarSize: 2,
                verticalScrollbarSize: 2,
              }}
              // value={data.config.paramsFn}
              env={{
                isNode: false,
                isElectronRenderer: false,
              }}
              minimap={{ enabled: false }}
            />
          </Collapse>
        </div>
      </div>,
      document.body
    )
  )

}