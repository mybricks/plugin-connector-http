import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { uuid } from '../utils';
import {
  exampleParamsFunc,
  exampleResultFunc,
  ServiceConfig,
  SERVICE_TYPE,
  TG_PANEL_VISIBLE,
  DEFAULT_PANEL_VISIBLE,
  KDEV_PANEL_VISIBLE,
  NO_PANEL_VISIBLE,
} from '../constant';
import css from '../style-cssModules.less';
import { get } from '../utils/lodash';
import { formatDate } from '../utils/moment';
import DefaultPanel from './compoment/defaultPanel';
import { getScript } from '../script';
import Toolbar from './compoment/toolbar';
import * as Icons from '../icon';
import GlobalPanel from './compoment/globalPanel';

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
  data: {
    connectors: any[],
    config: any
  };
  serviceList: any[]
  serviceTemplate: any;
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
  { key: 'content.doc', name: '文档链接', link: true },
  { key: 'updateTime', name: '更新时间', format: 'YYYY-MM-DD HH:mm:ss' },
];

export default function Sidebar({
  contentType,
  addActions,
  connector,
  serviceList = [],
  data,
}: Iprops) {
  const ref = useRef();
  const [searchValue, setSearchValue] = useState('');
  const [sidebarContext, setContext] = useState({
    eidtVisible: false,
    panelVisible: NO_PANEL_VISIBLE,
    kdev: {
      departmentOptions: [],
      interfaceOptions: [],
      searchOptions: [],
      interfaceMap: {},
    },
    tg: {},
    type: '',
    comlibNavVisible: true,
    isEdit: false,
    formModel: {},
    isDebug: false,
    currentClickMenu: 'comlib',
    contentType,
    templateVisible: false,
    templateForm: {},
    leftWidth: 271,
    enableRenderPortal: true,
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
      test: (...args: any) => connector.test(...args),
    },
    search: (v: string) => {
      setSearchValue(v);
    }
  });
  const updateService = useCallback(
    async (action?: string) => {
      return new Promise((resolve) => {
        const { id = uuid(), ...others }: any = sidebarContext.formModel;
        if (action === 'create' || !sidebarContext.type) {
          const serviceList: any[] = data.connectors.filter(
            (item) => item.id !== sidebarContext.formModel.id
          );
          const serviceItem = {
            id,
            type: sidebarContext.type || 'http',
            content: {
              input: encodeURIComponent(exampleParamsFunc),
              output: encodeURIComponent(exampleResultFunc),
              inputSchema: { type: 'object' },
              ...others,
            },
            createTime: Date.now(),
            updateTime: Date.now(),
          };
          serviceList.push(serviceItem);

          sidebarContext.connector.add({
            id,
            type: sidebarContext.type || 'http',
            title: others.title,
            inputSchema: others.inputSchema,
            outputSchema: others.outputSchema,
            script: getScript({
              ...serviceItem.content,
              globalParamsFn: data.config.paramsFn,
              mockAddress: ''
            }),
          });
          data.connectors = [...serviceList];
        } else {
          const list: any = [];
          data.connectors.forEach((service: any) => {
            if (service.id === id) {
              const serviceItem = {
                ...service,
                updateTime: Date.now(),
                content: { ...others },
              };
              list.push(serviceItem);
              sidebarContext.connector.update({
                id,
                title: others.title,
                type: sidebarContext.type || 'http',
                inputSchema: serviceItem.content.inputSchema,
                outputSchema: serviceItem.content.outputSchema,
                script: getScript({
                  ...serviceItem.content,
                  globalParamsFn: data.config.paramsFn,
                  mockAddress: '',
                }),
              });
            } else {
              list.push({ ...service });
            }
            data.connectors = list;
          });
        }
        // @ts-ignore
        resolve('');
        setRender({});
      });
    },
    [sidebarContext]
  );

  const createService = useCallback(() => {
    return updateService('create');
  }, []);

  const removeService = useCallback((id: string) => {
    return new Promise((resolve) => {
      const list = data.connectors.filter((service) => {
        return String(service.id) !== String(id);
      });
      data.connectors = list;
      sidebarContext.connector.remove(id);
      // message.success('删除成功');
      resolve('');
    });
  }, []);

  const clickRef = useRef();

  const setRender = useCallback((value: any) => {
    setContext((ctx) => ({
      ...ctx,
      formModel: {
        ...ctx.formModel,
      },
      ...value,
    }));
  }, []);

  const onEditItem = useCallback((item) => {
    const obj: any = {
      isEdit: true,
      isDebug: true,
      activeId: item.id,
      templateVisible: false,
    };
    if (item.type === SERVICE_TYPE.TG) {
      obj.panelVisible = TG_PANEL_VISIBLE;
      obj.formModel = { id: item.id, ...item.content };
    } else {
      obj.panelVisible = DEFAULT_PANEL_VISIBLE;
      obj.formModel = {
        ...item.content,
        id: item.id,
        input: item.content.input
          ? decodeURIComponent(item.content.input)
          : exampleParamsFunc,
        output: item.content.output
          ? decodeURIComponent(item.content.output)
          : exampleResultFunc,
      };
    }
    setRender(obj);
  }, []);

  const onCopyItem = useCallback(async (item) => {
    sidebarContext.formModel = { ...item.content };
    sidebarContext.formModel.title += ' 复制';
    setRender(sidebarContext);
    await createService();
  }, []);

  const onRemoveItem = useCallback(async (item) => {
    if (confirm(`确认删除 ${item.content.title} 吗`)) {
      await removeService(String(item.id));
      sidebarContext.panelVisible = NO_PANEL_VISIBLE;
      setRender(sidebarContext);
    }
  }, []);

  const addDefaultService = useCallback(async () => {
    sidebarContext.panelVisible = DEFAULT_PANEL_VISIBLE;
    sidebarContext.formModel = {
      title: '',
      path: '',
      desc: '',
      method: 'GET',
      useMock: false,
      input: exampleParamsFunc,
      output: exampleResultFunc,
    };
    setRender(sidebarContext);
  }, []);

  sidebarContext.addDefaultService = addDefaultService;

  const onGlobalConfigClick = useCallback(() => {
    sidebarContext.templateVisible = true;
    sidebarContext.panelVisible = NO_PANEL_VISIBLE;
    setRender(sidebarContext);
  }, []);

  const closeTemplateForm = useCallback(() => {
    sidebarContext.templateVisible = false;
    sidebarContext.isEdit = false;
    setRender(sidebarContext);
  }, []);

  const onCancel = useCallback(() => {
    sidebarContext.panelVisible = NO_PANEL_VISIBLE;
    sidebarContext.isDebug = false;
    sidebarContext.activeId = void 0;
    sidebarContext.isEdit = false;
    setRender(sidebarContext);
  }, []);
  sidebarContext.onCancel = onCancel;

  const setParams = useCallback((values) => {
    sidebarContext.formModel = { ...sidebarContext.formModel, ...values };
    sidebarContext.formModel.input = encodeURIComponent(values.input);
    sidebarContext.formModel.output = encodeURIComponent(values.output);
    setRender(sidebarContext);
  }, []);

  const onFinish = async (values: ServiceConfig) => {
    if (sidebarContext.isEdit) {
      await updateService();
    } else {
      await createService();
    }
    sidebarContext.panelVisible = NO_PANEL_VISIBLE;
    sidebarContext.activeId = void 0;
    sidebarContext.formModel = {};
    sidebarContext.isEdit = false;
    setRender(sidebarContext);
  };

  const onValuesChange = useCallback((_, values) => {
    setParams(values);
  }, []);

  const onItemClick = useCallback((e: any, item: any) => {
    if (item.id === sidebarContext.expandId) {
      sidebarContext.expandId = 0;
      setRender(sidebarContext);
      return;
    }
    sidebarContext.expandId = item.id;
    setRender(sidebarContext);
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
          sidebarContext={sidebarContext}
          setRender={setRender}
          onValuesChange={onValuesChange}
          onSubmit={onFinish}
          key={type}
          globalConfig={data.config}
          style={{ top: ref.current?.getBoundingClientRect().top }}
        />
      ) : (
        ReactDOM.createPortal(
          <div
            style={{ left: 361, top: ref.current?.getBoundingClientRect().top }}
            key={type}
            className={`${css['sidebar-panel-edit']} ${
              sidebarContext.panelVisible & visible
                ? css['sidebar-panel-edit-open']
                : ''
            }`}
          >
            <Compnent
              panelCtx={sidebarContext}
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
  }, [sidebarContext]);

  const renderGlobalPanel = useCallback(() => {
    return (
      <GlobalPanel
        sidebarContext={sidebarContext}
        style={{ top: ref.current?.getBoundingClientRect().top }}
        closeTemplateForm={closeTemplateForm}
        data={data}
      />
    );
  }, [sidebarContext]);

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
  };
  const initData =  useCallback(() => {
    data.config = data.config || { paramsFn: encodeURIComponent(exampleParamsFunc) };
    data.connectors = data.connectors.length === 0 ? serviceList : data.connectors;
  }, [])

  useMemo(() => {
    initData();
  }, [])

  const list = data.connectors;
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
            <Toolbar searchValue={searchValue} ctx={sidebarContext} setRender={setRender} />
          </div>
          <div className={css['sidebar-panel-list']}>
            {(searchValue
              ? list.filter((item) =>
                  item.content.title.includes(searchValue)
                )
              : list
            ).map((item) => {
              const expand = sidebarContext.expandId === item.id;
              item.updateTime = formatDate(item.updateTime || item.createTime);
              const { useMock } = item.content;
              return (
                <div key={item.id}>
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
                        <div
                          className={`${css.icon} ${
                            expand ? css.iconExpand : ''
                          }`}
                        >
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
        {renderGlobalPanel()}
      </div>
    </>
  );
}
