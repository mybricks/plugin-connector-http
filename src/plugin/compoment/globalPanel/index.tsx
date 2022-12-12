import React from 'react';
import ReactDOM from 'react-dom';
import css from '../../../../src/style-cssModules.less';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import Editor from '@mybricks/code-editor';
import curCss from './index.less';

export default function GlobalPanel({
  sidebarContext,
  closeTemplateForm,
  style,
  data,
  onChange,
}: any) {
  return ReactDOM.createPortal(
    sidebarContext.templateVisible ? (
      <div
        style={{
          left: 361,
          ...style,
        }}
        className={`${css['sidebar-panel-edit']}`}
      >
        <div className={css['sidebar-panel-title']}>
          <div>全局配置</div>
          <div>
            <div className={css['actions']}>
              <Button size='small' onClick={() => closeTemplateForm()}>
                关 闭
              </Button>
            </div>
          </div>
        </div>
        <div className={curCss.item}>
          <Collapse header='当开始请求'>
            <Editor
              width='100%'
              height={400}
              language='javascript'
              theme='light'
              lineNumbers='off'
              scrollbar={{
                horizontalScrollbarSize: 2,
                verticalScrollbarSize: 2,
              }}
              value={decodeURIComponent(data.config.paramsFn)}
              onChange={(code) => {
                data.config.paramsFn = decodeURIComponent(code);
                onChange({ paramsFn: code });
              }}
              env={{
                isNode: false,
                isElectronRenderer: false,
              }}
              minimap={{ enabled: false }}
            />
          </Collapse>
        </div>
        {data.config.resultFn ? (
          <div className={curCss.item}>
            <Collapse header='当返回响应'>
              <Editor
                width='100%'
                height={400}
                language='javascript'
                theme='light'
                lineNumbers='off'
                scrollbar={{
                  horizontalScrollbarSize: 2,
                  verticalScrollbarSize: 2,
                }}
                value={decodeURIComponent(data.config.resultFn)}
                onChange={(code) => {
                  data.config.resultFn = decodeURIComponent(code);
                  onChange({ resultFn: code });
                }}
                env={{
                  isNode: false,
                  isElectronRenderer: false,
                }}
                minimap={{ enabled: false }}
              />
            </Collapse>
          </div>
        ) : null}
      </div>
    ) : null,
    document.body
  );
}
