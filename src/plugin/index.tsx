import React, { useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useComputed, useObservable, uuid } from '@mybricks/rxui';
import { Button, Form, Input, Collapse } from 'antd';
import {
  exampleParamsFunc,
  exampleResultFunc,
  ServiceConfig,
  SidebarContext,
  templateResultFunc,
  SERVICE_TYPE,
  TG_PANEL_VISIBLE,
  DEFAULT_PANEL_VISIBLE,
  KDEV_PANEL_VISIBLE,
  NO_PANEL_VISIBLE,
} from '../constant';
import Editor from '@mybricks/code-editor';
import css from '../style-cssModules.less';
import { get } from '../utils/lodash';
import { formatDate } from '../utils/moment';
import DefaultPanel from './compoment/defaultPanel';
import { getScript } from '../script';
import Toolbar from './compoment/toolbar';
import * as Icons from '../icon';

let sidebarContext: SidebarContext;
let context: any;

interface Iprops {
  context: any;
  contentType: string;
  displayTemplate: boolean;
  templateConfig: any;
  resultFnVisible: boolean;
  tgAPIVisible?: boolean;
  domainVisible: boolean;
  connector: Iconnector;
  addActions?: any[];
  prefix: string;
}

interface Iconnector {
  add: (params: any) => null;
  remove: (id: number | string) => null;
  update: (params: any) => null;
  test: (...args: any) => any;
}

const interfaceParams = [
  { key: 'id', name: '标识', copy: true },
  { key: 'content.title', name: '标题' },
  { key: 'content.method', name: '方法' },
  { key: 'content.path', name: '路径' },
  { key: 'creatorName', name: '创建者' },
  { key: 'content.doc', name: '文档链接', link: true },
  { key: 'updateTime', name: '更新时间', format: 'YYYY-MM-DD HH:mm:ss' },
];

export default function Sidebar({
  context: myCtx,
  contentType,
  templateConfig = {},
  addActions,
  connector,
  prefix,
}: Iprops) {
  context = myCtx;
  const ref = useRef();
  useEffect(() => {
    context.projectData.serviceTemplate = {
      ...templateConfig.initialValues,
      paramsFn: encodeURIComponent(exampleParamsFunc),
      ...context.projectData.serviceTemplate,
    };
    if (!context.projectData.debugDomain) {
      context.projectData.debugDomain = templateConfig.debugDomain;
    }
  }, []);

  sidebarContext = useObservable(
    SidebarContext,
    (next) =>
      next({
        eidtVisible: false,
        panelVisible: NO_PANEL_VISIBLE,
        kdev: {
          departmentOptions: [],
          interfaceOptions: [],
          searchOptions: [],
          interfaceMap: {},
        },
        tg: {},
        comlibNavVisible: true,
        isEdit: false,
        formModel: {},
        isDebug: false,
        currentClickMenu: 'comlib',
        contentType,
        templateVisible: false,
        templateForm: {},
        leftWidth: 271,
        updateService,
        addActions: addActions
          ? addActions.some(({ type }: any) => type === 'defalut')
            ? addActions
            : [{ type: 'http', title: '默认' }].concat(addActions)
          : [{ type: 'http', title: '默认' }],
        connector: {
          add: (args: any) => connector.add({ ...args }),
          remove: (id: string) => connector.remove(id),
          update: (args: any) => {
            connector.update({ ...args });
          },
          test: (...args: any) => connector.test(...args)
        },
      }),
    { to: 'children' }
  );

  const [serviceForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [tgForm] = Form.useForm();
  const clickRef = useRef();
  sidebarContext.templateForm = templateForm;

  const onEditItem = useCallback((item) => {
    sidebarContext.isEdit = true;
    sidebarContext.isDebug = false;
    sidebarContext.activeId = item.id;
    sidebarContext.templateVisible = false;

    if (item.type === SERVICE_TYPE.TG) {
      sidebarContext.panelVisible = TG_PANEL_VISIBLE;
      sidebarContext.formModel = { id: item.id, ...item.content };
      const { title, apiName, token } = item.content;
      tgForm.setFieldsValue({
        title,
        apiName,
        token,
      });
    } else {
      serviceForm.resetFields();
      sidebarContext.panelVisible = DEFAULT_PANEL_VISIBLE;
      sidebarContext.formModel = {
        ...item.content,
        id: item.id,
        input: item.content.input
          ? decodeURIComponent(item.content.input)
          : exampleParamsFunc,
        output: item.content.output
          ? decodeURIComponent(item.content.output)
          : exampleResultFunc,
      };
      serviceForm.setFieldsValue(sidebarContext.formModel);
    }
  }, []);
  const onCopyItem = useCallback(async (item) => {
    sidebarContext.formModel = { ...item.content };
    sidebarContext.formModel.title += ' 复制';
    await createService();
    // message.success('复制成功');
  }, []);

  const onRemoveItem = useCallback(async (item) => {
    if (confirm(`确认删除 ${item.content.title} 吗`)) {
      await removeService(String(item.id));
      sidebarContext.panelVisible = NO_PANEL_VISIBLE;
    }
  }, []);

  const addDefaultService = useCallback(async () => {
    sidebarContext.panelVisible = DEFAULT_PANEL_VISIBLE;
    serviceForm.setFieldsValue({
      title: '',
      path: '',
      desc: '',
      method: 'GET',
      useMock: false,
      input: exampleParamsFunc,
      output: exampleResultFunc,
    });
  }, []);

  sidebarContext.addDefaultService = addDefaultService;

  const onGlobalConfigClick = useCallback(() => {
    sidebarContext.templateVisible = true;
    sidebarContext.panelVisible = NO_PANEL_VISIBLE;
  }, []);

  const closeTemplateForm = useCallback(() => {
    sidebarContext.templateVisible = false;
    sidebarContext.isEdit = false;
  }, []);

  const onCancel = useCallback(() => {
    sidebarContext.panelVisible = NO_PANEL_VISIBLE;
    sidebarContext.isDebug = false;
    sidebarContext.activeId = void 0;
    sidebarContext.isEdit = false;
  }, []);
  sidebarContext.onCancel = onCancel;

  const setParams = useCallback((values) => {
    sidebarContext.formModel = { ...sidebarContext.formModel, ...values };
    sidebarContext.formModel.input = encodeURIComponent(values.input);
    sidebarContext.formModel.output = encodeURIComponent(values.output);
  }, []);

  const onFinish = async (values: ServiceConfig) => {
    setParams(values);
    if (sidebarContext.isEdit) {
      await updateService();
    } else {
      // message.success('添加成功');
      await createService();
    }
  };

  const onValuesChange = useCallback((_, values) => {
    setParams(values);
  }, []);

  const onTemplateChange = useCallback((_, values) => {
    context.projectData.serviceTemplate = {
      ...values,
      resultFn: encodeURIComponent(values.resultFn || templateResultFunc),
      paramsFn: encodeURIComponent(values.paramsFn || exampleParamsFunc),
    };
    context.projectData.serviceTemplate.id =
      context.projectData.serviceTemplate.id || uuid();
  }, []);

  const onItemClick = useCallback((e: any, item: any) => {
    if (item.id === sidebarContext.expandId) {
      sidebarContext.expandId = 0;
      return;
    }
    sidebarContext.expandId = item.id;
  }, []);

  const onLinkClick = useCallback((url: string) => {
    window.open(url);
  }, []);

  const renderParam = useCallback(
    (item, { key, format, copy, link, isTpl }) => {
      if (format) {
        return formatDate(item[key], format);
      }
      if (copy) {
        return (
          <span
            className={css['sidebar-panel-list-item__copy']}
          >{`${item[key]}`}</span>
        );
      }
      if (link) {
        return get(item, key) ? (
          <span
            onClick={() => onLinkClick(get(item, key))}
            className={css['doc-link']}
          >
            点击跳转
          </span>
        ) : (
          '无'
        );
      }
      if (isTpl) {
        const domainObj = item[key];
        return (
          <>
            <span>
              {typeof domainObj === 'object'
                ? domainObj.domain || '无'
                : domainObj || '无'}
            </span>
            <br />
            {get(item, [key, 'laneId']) && (
              <span>{get(item, [key, 'laneId'])}</span>
            )}
          </>
        );
      }
      return get(item, key, '无');
    },
    []
  );

  const renderAddActions = useCallback(() => {
    return sidebarContext.addActions.map(({ type, render: Compnent }: any) => {
      let visible = 0;
      switch (type) {
        case 'http':
          visible = DEFAULT_PANEL_VISIBLE;
          break;
        case 'tg':
          visible = TG_PANEL_VISIBLE;
          break;
        case 'kdev':
          visible = KDEV_PANEL_VISIBLE;
      }
      return type === 'http' ? (
        <DefaultPanel
          context={context}
          sidebarContext={sidebarContext}
          form={serviceForm}
          onValuesChange={onValuesChange}
          onFinish={onFinish}
          prefix={prefix}
        />
      ) : (
        ReactDOM.createPortal(
          <div
            style={{ left: 361 }}
            className={`${css['sidebar-panel-edit']} ${
              sidebarContext.panelVisible & visible
                ? css['sidebar-panel-edit-open']
                : ''
            }`}
          >
            <Compnent
              panelCtx={sidebarContext}
              globalCtx={myCtx}
              constant={{
                exampleParamsFunc,
                exampleResultFunc,
                NO_PANEL_VISIBLE,
              }}
            />
          </div>,
          document.body
        )
      );
    });
  }, []);

  const getInterfaceParams = useCallback((item) => {
    if (item.type === SERVICE_TYPE.TG) {
      return interfaceParams.filter(
        ({ key }) =>
          !['content.path', 'content.method', 'content.desc'].includes(key)
      );
    }
    return interfaceParams;
  }, []);

  const onServiceItemTitleClick = (e, item) => {
    e.stopPropagation();
    const { id, content, type } = item;
    if (type === SERVICE_TYPE.TG) return;
    if (!content.mockAddress) {
      sidebarContext.toolTipId = id;
      setTimeout(() => {
        sidebarContext.toolTipId = void 0;
      }, 2500);
      return;
    }
    sidebarContext.formModel = {
      id,
      ...content,
      useMock: !content.useMock,
    };
    updateService();
    serviceForm.setFieldsValue({ useMock: sidebarContext.formModel.useMock });
  };

  const SidebarPanel = useComputed(() => {
    const { serviceTemplate = {} } = context.projectData;
    const list = [];
    if (myCtx.projectData.serviceList.length) {
      list.push(...myCtx.projectData.serviceList);
    }
    const initialValues = Object.keys(serviceTemplate).reduce((obj, key) => {
      if (key === 'id') return obj;
      if (
        ['resultFn', 'paramsFn', 'tgToken'].includes(key) &&
        serviceTemplate[key]
      ) {
        obj[key] = decodeURIComponent(serviceTemplate[key]);
        return obj;
      }
      const cur = serviceTemplate[key];
      obj[key] = typeof cur === 'object' ? cur : { domain: cur };
      return obj;
    }, {});
    return (
      <>
        <div
          ref={ref}
          className={`${css['sidebar-panel']} ${css['sidebar-panel-open']}`}
        >
          <div
            className={`${css['sidebar-panel-view']} ${
              sidebarContext.isEdit ? css.disabled : ''
            }`}
          >
            <div className={css['sidebar-panel-header']}>
              <div className={css['sidebar-panel-header__title']}>
                <span>服务连接</span>
                <div className={css.icon} onClick={onGlobalConfigClick}>
                  {Icons.set}
                </div>
              </div>
              <Toolbar ctx={sidebarContext} />
            </div>
            <div className={css['sidebar-panel-list']}>
              {(sidebarContext.searchValue
                ? list.filter((item) =>
                    item.content.title.includes(sidebarContext.searchValue)
                  )
                : list
              ).map((item) => {
                const expand = sidebarContext.expandId === item.id;
                item.updateTime = formatDate(
                  item.updateTime || item.createTime
                );
                const { useMock } = item.content;
                return (
                  <div
                  >
                    <div
                      key={item.id}
                      className={`${css['sidebar-panel-list-item']} ${
                        sidebarContext.activeId === item.id ? css.active : ''
                      }`}
                    >
                      <div>
                        <div
                          onClick={(e) => onItemClick(e, item)}
                          className={css['sidebar-panel-list-item__left']}
                        >
                          <div className={`${css.icon} ${expand ? css.iconExpand : ''}`}>
                            {Icons.arrowR}
                          </div>
                          <div
                            className={css.tag}
                            onClick={(e) => onServiceItemTitleClick(e, item)}
                          >
                            {useMock ? 'Mock' : '接口'}
                          </div>
                          <div className={css.name}>
                            <span>{item.content.title}</span>
                          </div>
                        </div>
                        <div className={css['sidebar-panel-list-item__right']}>
                            <div
                              ref={clickRef}
                              className={css.action}
                              onClick={() => onEditItem(item)}
                            >
                              {Icons.edit}
                            </div>
                            <div
                              className={css.action}
                              onClick={() => onCopyItem(item)}
                            >
                              {Icons.copy}
                            </div>
                            <div
                              className={css.action}
                              onClick={() => onRemoveItem(item)}
                            >
                              {Icons.remove}
                            </div>
                        </div>
                      </div>
                    </div>
                    {expand ? (
                      <div className={css['sidebar-panel-list-item__expand']}>
                        {getInterfaceParams(item).map((param: any) => {
                          return (
                            <div
                              className={css['sidebar-panel-list-item__param']}
                              key={param.key}
                            >
                              <span
                                className={css['sidebar-panel-list-item__name']}
                                style={{ width: param.width }}
                              >
                                {param.name}:
                              </span>
                              <span>{renderParam(item, param)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          {renderAddActions()}
          {ReactDOM.createPortal(
            <div
              style={{ left: 361 }}
              className={`${css['sidebar-panel-edit']} ${
                sidebarContext.templateVisible
                  ? css['sidebar-panel-edit-open']
                  : ''
              }`}
            >
              <div className={css['sidebar-panel-title']}>
                <div>编辑全局配置</div>
                <div className='fangzhou-theme'>
                  <div className={css['actions']}>
                    <Button size='small' onClick={() => closeTemplateForm()}>
                      关闭
                    </Button>
                  </div>
                </div>
              </div>
              <div className={css['sidebar-panel-content']}>
                <Form
                  className='fangzhou-theme'
                  form={templateForm}
                  labelCol={{ span: 5 }}
                  wrapperCol={{ span: 19 }}
                  size='small'
                  autoComplete='off'
                  initialValues={{
                    paramsFn: exampleParamsFunc,
                    resultFn: templateResultFunc,
                    ...templateConfig.initialValues,
                    ...initialValues,
                  }}
                  onValuesChange={onTemplateChange}
                >
                  <Collapse
                    className={css['sidebar-panel-code']}
                    defaultActiveKey={['domain', 'resultFn']}
                    ghost
                  >
                    {(serviceTemplate.prt || serviceTemplate.staging) && (
                      <Collapse.Panel
                        header='域名设置'
                        forceRender={true}
                        key='domain'
                      >
                        {serviceTemplate.pr && (
                          <Form.Item label='预发环境'>
                            <Form.Item name={['prt', 'domain']}>
                              <Input placeholder='https://www.prt.com' />
                            </Form.Item>
                            <Form.Item
                              name={['prt', 'laneId']}
                              style={{ marginTop: -16, marginBottom: 0 }}
                            >
                              <Input placeholder='泳道ID' />
                            </Form.Item>
                          </Form.Item>
                        )}
                        {serviceTemplate.staging && (
                          <Form.Item label='测试环境' name='staging'>
                            <Form.Item name={['staging', 'domain']}>
                              <Input placeholder='https://www.staging.com' />
                            </Form.Item>
                            <Form.Item
                              name={['staging', 'laneId']}
                              style={{ marginTop: -16, marginBottom: 0 }}
                            >
                              <Input placeholder='泳道ID' />
                            </Form.Item>
                          </Form.Item>
                        )}
                      </Collapse.Panel>
                    )}
                    <Collapse.Panel header='请求参数处理函数' key='paramsFn'>
                      <Form.Item
                        name='paramsFn'
                        style={{ width: '100%', marginBottom: 8 }}
                        wrapperCol={{ span: 24 }}
                      >
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
                          minimap={{ enabled: false }}
                        />
                      </Form.Item>
                    </Collapse.Panel>
                  </Collapse>
                </Form>
              </div>
            </div>,
            document.body
          )}
        </div>
      </>
    );
  });

  return <>{SidebarPanel}</>;
}

async function updateService(action?: string) {
  return new Promise((resolve) => {
    const { id = uuid(), ...others } = sidebarContext.formModel;
    const serviceList = [];
    if (action === 'create') {
      const serviceItem = {
        id,
        type: sidebarContext.type,
        content: {
          input: encodeURIComponent(exampleParamsFunc),
          output: encodeURIComponent(exampleResultFunc),
          inputSchema: { type: 'object' },
          ...others,
        },
        creatorId: context.user.userId,
        creatorName: context.user.name,
        createTime: Date.now(),
        updateTime: Date.now(),
      };
      serviceList.push(...context.projectData.serviceList, serviceItem);

      sidebarContext.connector.add({
        id,
        type: sidebarContext.formModel.type,
        title: others.title,
        inputSchema: others.inputSchema,
        outputSchema: others.outputSchema,
        script: getScript({
          ...serviceItem.content,
          globalParamsFn: context.projectData.serviceTemplate.paramsFn,
        }),
      });
    } else {
      context.projectData.serviceList.forEach((service: any) => {
        if (service.id === id) {
          const serviceItem = {
            ...service,
            updateTime: Date.now(),
            content: { ...others },
          };
          serviceList.push(serviceItem);
          sidebarContext.connector.update({
            id,
            title: others.title,
            type: sidebarContext.formModel.type,
            inputSchema: serviceItem.content.inputSchema,
            outputSchema: serviceItem.content.outputSchema,
            script: getScript({
              ...serviceItem.content,
              globalParamsFn: context.projectData.serviceTemplate.paramsFn,
            }),
          });
        } else {
          serviceList.push({ ...service });
        }
      });
    }
    context.projectData.serviceList = serviceList;
    // @ts-ignore
    resolve('');
  });
}

async function createService() {
  return updateService('create');
}

async function removeService(id: string) {
  return new Promise((resolve) => {
    const list = context.projectData.serviceList.filter((service) => {
      return String(service.id) !== String(id);
    });
    context.projectData.serviceList = list;
    sidebarContext.connector.remove(id);
    // message.success('删除成功');
    resolve('');
  });
}
