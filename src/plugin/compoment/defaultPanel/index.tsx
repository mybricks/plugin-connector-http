import { Button, Collapse, Form, Input, Radio, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PANEL_VISIBLE, NO_PANEL_VISIBLE } from '../../../constant';
import Editor from '@mybricks/code-editor';
import DebugForm from '../debug';

import css from './index.less';
import ReactDOM from 'react-dom';
import { fullScreen, fullScreenExit } from '../../../icon';
import RadioBtns from './RadioBtn';

const methodOpts = [
  {title: 'GET', value: 'GET'},
  {title: 'POST', value: 'POST'},
  {title: 'PUT', value: 'PUT'},
  {title: 'DELETE', value: 'DELETE'}
]

export default function DefaultPanel({
  sidebarContext,
  context,
  onValuesChange,
  onFinish,
  form,
  prefix,
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

  const onServiceSubmit = useCallback(async () => {
    if (!context.isLock) return;
    form.validateFields().then(() => {
      form.submit();
    });
  }, []);

  const onParamsEditorFullscreen = () => {
    paramRef.current.classList.add(css['sidebar-panel-code-full']);
    sidebarContext.fullscreenParamsEditor = true;
  };

  const onParamsEditorFullscreenExit = () => {
    paramRef.current.classList.remove(css['sidebar-panel-code-full']);
    sidebarContext.fullscreenParamsEditor = false;
  };
  const onResultEditorFullscreen = () => {
    sidebarContext.fullscrenResultEditor = true;
    resultRef.current.classList.add(css['sidebar-panel-code-full']);
  };
  const onResultEditorFullscreenExit = () => {
    sidebarContext.fullscrenResultEditor = false;
    resultRef.current.classList.remove(css['sidebar-panel-code-full']);
  };

  const onDocLinkClick = useCallback(() => {
    window.open(form.getFieldValue('doc'));
  }, []);

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
      style={{ left: 361 }}
      className={`${css['sidebar-panel-edit']} ${
        sidebarContext.panelVisible & DEFAULT_PANEL_VISIBLE
          ? css['sidebar-panel-edit-open']
          : ''
      }`}
    >
      <div className={css['sidebar-panel-title']}>
        <div>{sidebarContext.formModel?.title}</div>
        <div className='fangzhou-theme'>
          <div className={css['actions']}>
            {!sidebarContext.isEidt && (
              <Button
                type='primary'
                size='small'
                disabled={!context.isLock}
                onClick={() => onServiceSubmit()}
              >
                保存
              </Button>
            )}
            <Button size='small' onClick={() => onClosePanel()}>
              关闭
            </Button>
          </div>
        </div>
      </div>
      <div className={css['sidebar-panel-content']}>
        <Form
          className='fangzhou-theme'
          form={form}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 19 }}
          size='small'
          autoComplete='off'
          onValuesChange={onChange}
          onFinish={onFormSubmit}
        >
          <div className={css.ct}>
            <Collapse
              className={css['sidebar-panel-code']}
              ghost
              defaultActiveKey={['basicInfo']}
            >
              <Collapse.Panel
                forceRender
                header='基本信息'
                key='basicInfo'
                style={{ position: 'relative' }}
              >
                <div className={css.item}>
                  <label>
                    <i>*</i>名称
                  </label>
                  {/* <div
                    className={`${css.editor} ${css.textEdt} ${
                      ctx.titleErr ? css.error : ''
                    }`}
                    data-err={ctx.titleErr}
                  >
                    <input
                      type={'text'}
                      placeholder={'服务接口的标题'}
                      value={ctx.data.title}
                      onChange={(e) => {
                        ctx.titleErr = void 0;
                        ctx.data.title = e.target.value;
                      }}
                    />
                  </div> */}
                </div>
                <div className={css.item}>
                  <label>
                    <i>*</i>地址
                  </label>
                  {/* <div
                    className={`${css.editor} ${css.textEdt} ${
                      ctx.urlErr ? css.error : ''
                    }`}
                    data-err={ctx.urlErr}
                  >
                    <textarea
                      value={ctx.data.url}
                      placeholder={'接口的完整地址，以http://或https://开始'}
                      onChange={(e) => {
                        ctx.urlErr = void 0;
                        ctx.data.url = e.target.value;
                        ctx.data.returnSchema.fact = void 0; //clear it
                      }}
                    />
                  </div> */}
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
              </Collapse.Panel>
            </Collapse>
          </div>
          <div className={css.ct}>
            <Collapse className={css['sidebar-panel-code']} ghost>
              <Collapse.Panel
                forceRender
                header='请求参数处理函数'
                key='input'
                style={{ position: 'relative' }}
              >
                {sidebarContext.fullscreenParamsEditor ? (
                  <div
                    onClick={onParamsEditorFullscreenExit}
                    className={css['sidebar-panel-code-icon-full']}
                  >
                    {fullScreenExit}
                  </div>
                ) : (
                  <div
                    onClick={onParamsEditorFullscreen}
                    className={css['sidebar-panel-code-icon']}
                  >
                    {fullScreen}
                  </div>
                )}
                <Form.Item
                  name='input'
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    height: 300,
                    overflow: 'auto',
                  }}
                  wrapperCol={{ span: 24 }}
                >
                  <Editor
                    onMounted={(editor, monaco, container) => {
                      paramRef.current = container;
                      container.onclick = (e) => {
                        if (e.target === container) {
                          onParamsEditorFullscreenExit();
                        }
                      };
                    }}
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
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </div>
          <div className={css.ct}>
            <Collapse className={css['sidebar-panel-code']} ghost>
              <Collapse.Panel
                forceRender
                header='返回结果处理函数'
                key='output'
                style={{ position: 'relative' }}
              >
                {sidebarContext.fullscrenResultEditor ? (
                  <div
                    onClick={onResultEditorFullscreenExit}
                    className={css['sidebar-panel-code-icon-full']}
                  >
                    {fullScreen}
                  </div>
                ) : (
                  <div
                    onClick={onResultEditorFullscreen}
                    className={css['sidebar-panel-code-icon']}
                  >
                    {fullScreen}
                  </div>
                )}
                <Form.Item
                  name='output'
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    height: 300,
                    overflow: 'auto',
                  }}
                  wrapperCol={{ span: 24 }}
                >
                  <Editor
                    onMounted={(editor, monaco, container) => {
                      resultRef.current = container;
                      container.onclick = (e) => {
                        if (e.target === container) {
                          onResultEditorFullscreenExit();
                        }
                      };
                    }}
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
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </div>
          <div className={css.ct}>
            <Collapse className={css['sidebar-panel-code']} ghost>
              <Collapse.Panel
                forceRender
                header='其他信息'
                key='otherInfo'
                style={{ position: 'relative' }}
              >
                <Form.Item label='接口描述' name='desc'>
                  <Input />
                </Form.Item>
                <Form.Item
                  label={
                    <Tooltip placement='bottom' title='点击跳转'>
                      <span
                        className={css['doc-link']}
                        onClick={onDocLinkClick}
                      >
                        文档链接
                      </span>
                    </Tooltip>
                  }
                  name='doc'
                >
                  <Input.TextArea style={{ height: 80 }} />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </div>
        </Form>
        <div className={css.ct}>
          <Collapse
            className={css['sidebar-panel-code']}
            defaultActiveKey={['debugInfo']}
            ghost
          >
            <Collapse.Panel
              forceRender
              header='接口调试'
              key='debugInfo'
              style={{ position: 'relative' }}
            >
              <DebugForm
                context={context}
                sidebarContext={sidebarContext}
                panelForm={form}
                prefix={prefix}
              />
            </Collapse.Panel>
          </Collapse>
        </div>
      </div>
    </div>,
    document.body
  );
}
