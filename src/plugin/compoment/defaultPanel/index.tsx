import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PANEL_VISIBLE, NO_PANEL_VISIBLE } from '../../../constant';
import Editor from '@mybricks/code-editor';
import DebugForm from '../debug';

import css from './index.less';
import parenetCss from '../../../style-cssModules.less';
import ReactDOM from 'react-dom';
import { fullScreen, fullScreenExit } from '../../../icon';
import RadioBtns from './RadioBtn';
import Button from '../../../components/Button';
import Collapse from '../../../components/Collapse';
import FormItem from '../../../components/FormItem';
import Input, { TextArea } from '../../../components/Input';

const methodOpts = [
  { title: 'GET', value: 'GET' },
  { title: 'POST', value: 'POST' },
  { title: 'PUT', value: 'PUT' },
  { title: 'DELETE', value: 'DELETE' },
];

export default function DefaultPanel({
  sidebarContext,
  onValuesChange,
  onFinish,
  style,
  prefix,
  onSubmit
}: any) {
  const paramRef = useRef();
  const resultRef = useRef();
  const [useMock, setUseMock] = useState(sidebarContext.formModel.useMock);
  const onClosePanel = useCallback(() => {
    sidebarContext.panelVisible = NO_PANEL_VISIBLE;
    sidebarContext.isDebug = false;
    sidebarContext.activeId = void 0;
    sidebarContext.formModel = {};
    sidebarContext.isEdit = false;
  }, []);

  const onParamsEditorFullscreen = () => {
    paramRef.current?.classList.add(css['sidebar-panel-code-full']);
    sidebarContext.fullscreenParamsEditor = true;
  };

  const onParamsEditorFullscreenExit = () => {
    paramRef.current?.classList.remove(css['sidebar-panel-code-full']);
    sidebarContext.fullscreenParamsEditor = false;
  };
  const onResultEditorFullscreen = () => {
    sidebarContext.fullscrenResultEditor = true;
    resultRef.current?.classList.add(css['sidebar-panel-code-full']);
  };
  const onResultEditorFullscreenExit = () => {
    sidebarContext.fullscrenResultEditor = false;
    resultRef.current?.classList.remove(css['sidebar-panel-code-full']);
  };

  // const onDocLinkClick = useCallback(() => {
  //   window.open(form.getFieldValue('doc'));
  // }, []);

  const setParams = useCallback((values) => {
    sidebarContext.formModel = { ...sidebarContext.formModel, ...values };
    sidebarContext.formModel.input = encodeURIComponent(values.input);
    sidebarContext.formModel.output = encodeURIComponent(values.output);
  }, []);

  const onChange = (changedValue: any, allValues: any) => {
    if (changedValue.useMock !== void 0) {
      setUseMock(changedValue.useMock);
    }
    onValuesChange(changedValue, allValues);
  };

  useEffect(() => {
    setUseMock(sidebarContext.formModel.useMock);
  }, [sidebarContext.formModel.useMock]);

  const onFormSubmit = useCallback((values) => {
    onFinish(values).then(() => {
      onClosePanel();
    });
  }, []);

  return ReactDOM.createPortal(
    <div
      style={{ left: 361, ...style }}
      className={`${parenetCss['sidebar-panel-edit']} ${
        sidebarContext.panelVisible & DEFAULT_PANEL_VISIBLE
          ? parenetCss['sidebar-panel-edit-open']
          : ''
      }`}
    >
      <div className={parenetCss['sidebar-panel-title']}>
        <div>{sidebarContext.formModel?.title}</div>
        <div className='fangzhou-theme'>
          <div className={parenetCss['actions']}>
            {!sidebarContext.isEidt && (
              <Button
                type='primary'
                size='small'
                onClick={() => onSubmit()}
              >
                保 存
              </Button>
            )}
            <Button size='small' onClick={() => onClosePanel()}>
              关 闭
            </Button>
          </div>
        </div>
      </div>
      <div className={parenetCss['sidebar-panel-content']}>
        <>
          <div className={css.ct}>
            <Collapse header='基本信息' defaultChecked={true}>
              <div className={css.item}>
                <label>
                  <i>*</i>名称
                </label>
                <div
                  className={`${css.editor} ${css.textEdt} ${
                    sidebarContext.titleErr ? css.error : ''
                  }`}
                  data-err={sidebarContext.titleErr}
                >
                  <input
                    type={'text'}
                    placeholder={'服务接口的标题'}
                    defaultValue={sidebarContext.formModel.title}
                    onChange={(e) => {
                      sidebarContext.titleErr = void 0;
                      sidebarContext.formModel.title = e.target.value;
                    }}
                  />
                </div>
              </div>
              <div className={css.item}>
                <label>
                  <i>*</i>地址
                </label>
                <div
                  className={`${css.editor} ${css.textEdt} ${
                    sidebarContext.urlErr ? css.error : ''
                  }`}
                  data-err={sidebarContext.urlErr}
                >
                  <textarea
                    value={sidebarContext.formModel.path}
                    placeholder={'接口的请求路径'}
                    onChange={(e) => {
                      sidebarContext.urlErr = void 0;
                      sidebarContext.formModel.path = e.target.value;
                    }}
                  />
                </div>
              </div>
              <div className={css.sperator}></div>
              <div className={css.item}>
                <label>
                  <i>*</i>请求方法
                </label>
                <div className={css.editor}>
                  <RadioBtns
                    binding={[sidebarContext.formModel, 'method']}
                    options={methodOpts}
                  />
                </div>
              </div>
            </Collapse>
          </div>
          <div className={css.ct}>
            <Collapse header='请求参数处理函数'>
              {sidebarContext.fullscreenParamsEditor ? (
                <div
                  onClick={onParamsEditorFullscreenExit}
                  className={parenetCss['sidebar-panel-code-icon-full']}
                >
                  {fullScreenExit}
                </div>
              ) : (
                <div
                  onClick={onParamsEditorFullscreen}
                  className={parenetCss['sidebar-panel-code-icon']}
                >
                  {fullScreen}
                </div>
              )}
              <Editor
                onMounted={(editor, monaco, container) => {
                  paramRef.current = container;
                  container.onclick = (e) => {
                    if (e.target === container) {
                      onParamsEditorFullscreenExit();
                    }
                  };
                }}
                env={{
                  isNode: false,
                  isElectronRenderer: false,
                }}
                onChange={(code: string) => {
                  sidebarContext.formModel.input = encodeURIComponent(code);
                }}
                value={decodeURIComponent(sidebarContext.formModel.input)}
                width='100%'
                height='100%'
                minHeight={300}
                language='javascript'
                theme='light'
                lineNumbers='off'
                scrollbar={{
                  horizontalScrollbarSize: 2,
                  verticalScrollbarSize: 2,
                }}
                minimap={{ enabled: false }}
              />
            </Collapse>
          </div>
          <div className={css.ct}>
            <Collapse header='返回结果处理函数'>
              {sidebarContext.fullscrenResultEditor ? (
                <div
                  onClick={onResultEditorFullscreenExit}
                  className={parenetCss['sidebar-panel-code-icon-full']}
                >
                  {fullScreen}
                </div>
              ) : (
                <div
                  onClick={onResultEditorFullscreen}
                  className={parenetCss['sidebar-panel-code-icon']}
                >
                  {fullScreen}
                </div>
              )}
              <Editor
                onMounted={(editor, monaco, container) => {
                  resultRef.current = container;
                  container.onclick = (e) => {
                    if (e.target === container) {
                      onResultEditorFullscreenExit();
                    }
                  };
                }}
                env={{
                  isNode: false,
                  isElectronRenderer: false,
                }}
                onChange={(code: string) => {
                  sidebarContext.formModel.output = encodeURIComponent(code);
                }}
                value={decodeURIComponent(sidebarContext.formModel.output)}
                width='100%'
                height='100%'
                minHeight={300}
                language='javascript'
                theme='light'
                lineNumbers='off'
                scrollbar={{
                  horizontalScrollbarSize: 2,
                  verticalScrollbarSize: 2,
                }}
                minimap={{ enabled: false }}
              />
            </Collapse>
          </div>
          <div className={css.ct}>
            <Collapse header='其他信息'>
              <FormItem label='接口描述'>
                <Input
                  value={sidebarContext.formModel.desc}
                  onChange={(e) =>
                    (sidebarContext.formModel.desc = e.target.value)
                  }
                />
              </FormItem>
              <FormItem label="文档链接">
                <TextArea  style={{ height: 80 }} onChange={e => {
                  sidebarContext.formModel.doc = e.target.value;
                }} value={sidebarContext.formModel.doc} />
              </FormItem>
            </Collapse>
          </div>
        </>
        <div className={css.ct}>
          <Collapse key={Math.random()} header='接口调试' defaultFold={false}>
            <DebugForm
              sidebarContext={sidebarContext}
              prefix={prefix}
            />
          </Collapse>
        </div>
      </div>
    </div>,
    document.body
  );
}
