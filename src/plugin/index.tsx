import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { filterConnectorsByKeyword, findConnector, getConnectorsByTree, uuid, replaceConnectorIdsAndTime } from '../utils';
import { exampleParamsFunc, exampleResultFunc, GLOBAL_PANEL, PLUGIN_CONNECTOR_NAME, SERVICE_TYPE, SEPARATOR_TYPE } from '../constant';
import { cloneDeep, get } from '../utils/lodash';
import { formatDate } from '../utils/moment';
import DefaultPanel from './components/defaultPanel';
import Toolbar from './components/toolbar';
import * as Icons from '../icon';
import GlobalPanel from './components/globalPanel';
import Switch from '../components/Switch';
import Drag from '../components/drag';
import { copyText } from '../utils/copy';
import FolderPanel from './components/folderPanel';
import { notice } from '../components';
import { folder, plus } from '../icon';
import Dropdown from '../components/Dropdown';
import JsPanel from "./components/jsPanel";
// import ComsPanel from "./components/comsPanel";
// import AddComPanel from "./components/addComPanel";
import AddComPanel2 from "./components/addComPanel2";

import styles from './style-cssModules.less';

interface IProps {
  connector: IConnector;
	component: IComponent;
	serviceListUrl?: string;
  callServiceUrl?: string;
  addActions?: any[];
  data: {
    connectors: any[];
    config: { paramsFn: string; resultFn?: string; globalMock?: boolean };
  };
  initialValue: any;
	visibility?: 'hidden' | 'visible';
}

interface IConnector {
  add: (params: any) => null;
  remove: (id: number | string) => null;
	getAllByType: (id: string) => Array<any>;
  update: (params: any) => null;
  test: (...args: any) => any;
	getById: (...args: any) => any;
}

interface IComponent {
	addInstance: (value: any) => void;
	getComDefAryBySchema: (schema: any) => any;
}

const interfaceParams = [
  { key: 'id', name: '标识', copy: true },
  { key: 'content.title', name: '标题' },
  { key: 'content.method', name: '方法' },
  { key: 'content.path', name: '路径' },
  { key: 'content.doc', name: '文档链接', link: true },
  { key: 'updateTime', name: '更新时间', format: 'YYYY-MM-DD HH:mm:ss' },
	{ key: 'schemaMatchComs', name: "组件", schemaMatchComs: true }, // 展示与连接器schema匹配的组件
];

const Plugin: FC<IProps> = props => {
	const { addActions, connector, data, serviceListUrl, initialValue = {}, visibility, component } = props;
  const pluginRef = useRef<HTMLDivElement>(null);
  const blurMap = useRef<Record<string, () => void>>({});
	// const globalContext = useRef<Record<string, any>>({});
	// const [addComPanelContext, setAddComPanelContext] = useState({
	// 	addPanel: false,
	// 	popup: false
	// });
  const [searchValue, setSearchValue] = useState('');
  const [expandIdList, setExpandIdList] = useState([]);
  const [sidebarContext, setContext] = useState<any>({
    activeId: '',
    type: '',
    isEdit: false,
    formModel: { path: '', title: '', id: '', type: '', input: '', output: '' },
    addActions: (
			[].concat(addActions
		    ? addActions.some(({ type }: any) => type === 'default')
			    ? addActions
			    : [{ type: SERVICE_TYPE.HTTP, title: '普通接口' }, { type: SERVICE_TYPE.JS, title: 'JS' }].concat(addActions)
		    : [{ type: SERVICE_TYPE.HTTP, title: '普通接口' }, { type: SERVICE_TYPE.JS, title: 'JS' }])
    )
	    .concat([{ type: SEPARATOR_TYPE, title: '' }, { type: SERVICE_TYPE.FOLDER, title: '文件夹' }, { type: SERVICE_TYPE.IMPORT, title: '导入'}]),
    connector: {
      add: (args: any) => connector.add({ ...args }),
      remove: (id: string) => connector.remove(id),
			getAllByType: (type: string) => (connector.getAllByType?.(type) || []),
      update: (args: any) => connector.update({ ...args }),
      test: (...args: any) => connector.test(...args),
			getById: (...args: any) => connector.getById(...args),
    },
		component,
    search: setSearchValue,
  });
  const updateService = async (action?: string, item?: any) => {
	  return new Promise((resolve) => {
		  const { id = uuid(), script, ...others }: any = (item || sidebarContext.formModel);
		  if (action === 'create') {
			  const serviceItem = {
				  id,
				  type: sidebarContext.formModel.type || sidebarContext.type || SERVICE_TYPE.HTTP,
				  content: {
					  input: encodeURIComponent(exampleParamsFunc),
					  output: encodeURIComponent(exampleResultFunc),
					  inputSchema: { type: 'object' },
					  ...others,
				  },
				  script,
				  createTime: Date.now(),
				  updateTime: Date.now(),
			  };
			  /** 插件内连接器数据 */
				if (!sidebarContext.parent) {
					data.connectors.push(serviceItem);
				} else {
					const { index, parent } = findConnector(data.connectors, sidebarContext.parent);

					if (parent) {
						parent[index].children.push(serviceItem);
					}
				}
			  /** 设计器内连接器数据，支持服务接口组件选择接口 */
			  sidebarContext.connector.add({
				  id,
				  type: sidebarContext.formModel.type || sidebarContext.type || SERVICE_TYPE.HTTP,
				  title: others.title,
          connectorName: PLUGIN_CONNECTOR_NAME,
          script: undefined,
          globalMock: data.config.globalMock,
				  inputSchema: others.inputSchema,
				  markList: others.markList || []
			  });
		  } else {
			  const { index, parent } = findConnector(data.connectors, { id });
				if (parent) {
					const serviceItem = { ...parent[index], updateTime: Date.now(), content: { ...others } };
					parent?.splice(index, 1, serviceItem);

					try {
						sidebarContext.connector.update({
							id,
							title: others.title || serviceItem.content.title,
							type: serviceItem.type,
							connectorName: PLUGIN_CONNECTOR_NAME,
							script: undefined,
							globalMock: data.config.globalMock,
							inputSchema: serviceItem.content.inputSchema,
							markList: serviceItem.content.markList || []
						});
					} catch (error) {}
				}
		  }
		  // @ts-ignore
		  resolve('');
	  });
  };

  const removeService = useCallback((item: any) => {
    return new Promise((resolve) => {
	    const { index, parent } = findConnector(data.connectors, item);
	    parent?.splice(index, 1);
	    getConnectorsByTree(item.children ?? [item]).forEach(con => {
		    try {
			    sidebarContext.connector.remove(con.id);
		    } catch (error) {}
	    });
      resolve('');
    });
  }, [data]);

  const clickRef = useRef();

  const setRender = useCallback((value: any) => {
    setContext((ctx: any) => ({
      ...ctx,
      formModel: {
        ...ctx.formModel,
      },
      ...value,
    }));
  }, []);

	// const onAddComItem = useCallback((item) => {
	// 	const connector = sidebarContext.connector.getById(item.id);
	// 	const schema = connector.markList[0].outputSchema;
	// 	const matchedComponentsBySchema = component.getComDefAryBySchema(schema);

	// 	setRender({
	// 		coms: matchedComponentsBySchema,
	// 		formModel: {
	// 			coms: matchedComponentsBySchema,
	// 			connector,
	// 		},
	// 		type: 'addCom'
	// 	});
	// }, [])

  const onEditItem = useCallback((item) => {
		if (sidebarContext.isEdit && item.id === sidebarContext.activeId) {
			setRender({ type: '', activeId: void 0, isEdit: false });
			return;
		}

    const obj: any = { isEdit: true, activeId: item.id };
    if (item.type === SERVICE_TYPE.TG) {
      obj.type = SERVICE_TYPE.TG;
      obj.formModel = { id: item.id, type: item.type, ...item.content };
    } else if (item.type === SERVICE_TYPE.FOLDER) {
	    obj.type = SERVICE_TYPE.FOLDER;
	    obj.formModel = item;
    } else if (item.type === SERVICE_TYPE.JS) {
			obj.type = SERVICE_TYPE.JS;
	    obj.formModel = item;
		} else {
      const noUseInnerEdit = sidebarContext.addActions.find(action => action.type === item.type)?.noUseInnerEdit;
      obj.type = noUseInnerEdit ? item.type : SERVICE_TYPE.HTTP;
      obj.formModel = {
				/** 防止数据被代理 */
        ...JSON.parse(JSON.stringify(item.content)),
        type: item.type,
        id: item.id,
        input: item.content.input || exampleParamsFunc,
        output: item.content.output || exampleResultFunc,
      };
    }
    setRender(obj);
  }, [sidebarContext]);

  const onCopyItem = useCallback(async (item, parent) => {
		if (item.type === SERVICE_TYPE.HTTP) {
			sidebarContext.formModel = cloneDeep(item.content);
			sidebarContext.parent = parent;
			sidebarContext.formModel.title += ' 复制';
			sidebarContext.formModel.id = uuid();
			setRender(sidebarContext);
			await updateService('create');
		} else {
			const copyItem = cloneDeep(item);
			copyItem.id = uuid();
			copyItem.content.title += ' 复制';
			if (item.type === SERVICE_TYPE.JS) {
				onJsFinish(copyItem);
			}
		}
  }, []);

	const onExportItem = useCallback(async (item) => {
    let formModel = item.type === SERVICE_TYPE.HTTP ? cloneDeep(item) : cloneDeep(item);
    formModel.id = uuid();
		copyText(JSON.stringify({
			formModel
		}));

		notice('导出成功', { type: 'success', targetContainer: document.body });
  }, []);

  const onRemoveItem = useCallback(async (item) => {
	  if (confirm(item.type === SERVICE_TYPE.FOLDER ? `确认删除文件夹 ${item.content.title} 吗，其包含接口也将被删除` : `确认删除 ${item.content.title} 吗`)) {
		  await removeService(item);
		  sidebarContext.type = '';
		  setRender(sidebarContext);
	  }
  }, [sidebarContext, data]);

	sidebarContext.addDefaultService = useCallback(async () => {
		sidebarContext.isEdit = false;
		sidebarContext.type = SERVICE_TYPE.HTTP;
	  sidebarContext.formModel = {
			id: uuid(),
		  title: '',
		  type: sidebarContext.formModel?.type || SERVICE_TYPE.HTTP,
		  path: '',
		  desc: '',
		  method: 'GET',
		  input: encodeURIComponent(exampleParamsFunc),
		  output: encodeURIComponent(exampleResultFunc),
	  };
	  setRender(sidebarContext);
  }, [sidebarContext]);

	sidebarContext.addServiceFolder = useCallback(async () => {
		sidebarContext.isEdit = false;
		sidebarContext.type = SERVICE_TYPE.FOLDER;
	  sidebarContext.formModel = {
			id: uuid(),
		  content: {
			  title: '文件夹',
		  },
		  type: SERVICE_TYPE.FOLDER,
		  children: []
	  };
	  setRender(sidebarContext);
  }, [sidebarContext]);

	sidebarContext.importService = useCallback(async () => {
		let clipboard = prompt("将导出的接口数据复制到输入框");
		let isValid = false
		if (clipboard == null || clipboard == "") {
			return
		} else {
			try {
				let parsed = JSON.parse(clipboard)
				if(parsed.formModel) {
					isValid = true;
					parsed.formModel = replaceConnectorIdsAndTime(parsed.formModel);
					if (!sidebarContext.parent) {
						data.connectors.push(parsed.formModel);
					} else {
						const { index, parent } = findConnector(data.connectors, sidebarContext.parent);
						if (parent) {
							parent[index].children.push(parsed.formModel);
						}
					}
					let connectors = getConnectorsByTree([parsed.formModel])
					connectors.forEach(connect => {
						/** 设计器内连接器数据，支持服务接口组件选择接口 */
						sidebarContext.connector.add({
							id: connect.id,
							type: connect.type || SERVICE_TYPE.HTTP,
							title: connect.content.title,
							connectorName: PLUGIN_CONNECTOR_NAME,
							script: undefined,
							globalMock: data.config.globalMock,
							inputSchema: connect.content.inputSchema,
							markList: connect.content.markList || []
						});
					})

					notice('导入成功', { type: 'success', targetContainer: document.body});
				}
			} catch (error) {
			}
		}
		if(!isValid) {
			notice('输入数据格式有误', { targetContainer: document.body });
		}
	}, [sidebarContext])
  sidebarContext.updateService = updateService;

	sidebarContext.addDefaultJs = useCallback(() => {
		sidebarContext.isEdit = false;
		sidebarContext.type = SERVICE_TYPE.JS;
		sidebarContext.formModel = {
			id: uuid(),
		  type: SERVICE_TYPE.JS,
			content: {
				title: "[临时] 记得删除"
			},
	  };
	  setRender(sidebarContext);
	}, [sidebarContext])

  const onGlobalConfigClick = useCallback(() => {
    sidebarContext.type = GLOBAL_PANEL;
    setRender(sidebarContext);
  }, []);

  const closeTemplateForm = useCallback(() => {
    sidebarContext.type = '';
    sidebarContext.isEdit = false;
	  sidebarContext.activeId = void 0;
	  sidebarContext.formModel = {};
    setRender(sidebarContext);
  }, []);

  const onFinish = async () => {
    if (sidebarContext.isEdit) {
      await updateService();
    } else {
      await updateService('create');
    }
    sidebarContext.type = '';
    sidebarContext.activeId = void 0;
    sidebarContext.formModel = {};
    sidebarContext.isEdit = false;
    setRender(sidebarContext);
  };

	const onFolderFinish = (folder) => {
		if (sidebarContext.isEdit) {
			const { index, parent } = findConnector(data.connectors, folder);

			parent?.splice(index, 1, folder);
		} else {
			if (!sidebarContext.parent) {
				data.connectors.push(folder);
			} else {
				const { index, parent } = findConnector(data.connectors, sidebarContext.parent);

				if (parent) {
					parent[index].children.push(folder);
				}
			}
		}

		closeTemplateForm();
	};

	const onJsFinish = (js) => {
		if (sidebarContext.isEdit) {
			const { index, parent } = findConnector(data.connectors, js);
			parent?.splice(index, 1, {
				...js,
				updateTime: Date.now()
			});
			sidebarContext.connector.update({
				id: js.id,
				type: SERVICE_TYPE.JS,
				title: js.content.title,
				connectorName: PLUGIN_CONNECTOR_NAME,
				markList: js.content.markList
			});
		} else {
			if (!sidebarContext.parent) {
				data.connectors.push({
					...js,
					createTime: Date.now(),
					updateTime: Date.now()
				});
			} else {
				const { index, parent } = findConnector(data.connectors, sidebarContext.parent);
				if (parent) {
					parent[index].children.push({
						...js,
						createTime: Date.now(),
						updateTime: Date.now()
					});
				}
			}
			sidebarContext.connector.add({
				id: js.id,
				type: SERVICE_TYPE.JS,
				title: js.content.title,
				connectorName: PLUGIN_CONNECTOR_NAME,
				markList: js.content.markList
			});
		}
		closeTemplateForm();
	}

	// const onComsFinish = ({ com, connector, position }) => {
	// 	component.addInstance({
	// 		connector,
	// 		namespace: com.namespace
	// 	})

	// 	closeTemplateForm();
	// }

  const onItemClick = useCallback((item: any) => {
	  setExpandIdList(list => list.includes(item.id) ? list.filter(id => id !== item.id) : [...list, item.id]);
  }, []);

  const onLinkClick = useCallback((url: string) => {
    window.open(url);
  }, []);

  const renderParam = useCallback(
    (item, { key, format, copy, link, isTpl, schemaMatchComs }) => {
      if (format) {
        return formatDate(item[key], format);
      }
      if (copy) {
        return (
          <span className={styles['sidebar-panel-list-item__copy']}>{item[key]}</span>
        );
      }
      if (link) {
        return get(item, key) ? (
          <span onClick={() => onLinkClick(get(item, key))} className={styles['doc-link']}>
            点击跳转
          </span>
        ) : '无';
      }
      if (isTpl) {
        const domainObj = item[key];
        return (
          <>
            <span>{typeof domainObj === 'object' ? domainObj.domain || '无' : domainObj || '无'}</span>
            <br />
            {get(item, [key, 'laneId']) && <span>{get(item, [key, 'laneId'])}</span>}
          </>
        );
      }
			if (schemaMatchComs) {
				const connector = sidebarContext.connector.getById(item.id);
				const schema = connector.markList[0].outputSchema;
				const matchedComponentsBySchema = sidebarContext.component.getComDefAryBySchema(schema);
				return (
					<AddComPanel2
						connector={connector}
						coms={matchedComponentsBySchema}
						component={component}
					/>
				)
			}
      return get(item, key, '无');
    },
    []
  );

  const renderAddActions = useCallback(() => {
		const curAction = sidebarContext.addActions.find(action => action.type === sidebarContext.type && action.render);
		let node = null;

		if (curAction) {
			node = (
        curAction?.render({
          onClose: closeTemplateForm,
          originConnectors: cloneDeep(data.connectors),
					globalConfig: data.config,
	        isEdit: sidebarContext.isEdit,
          initService: sidebarContext.isEdit ? sidebarContext.formModel : undefined,
          connectorService: {
            add(item: Record<string, any>) {
              updateService('create', item);
            },
            remove: removeService,
            update(item: Record<string, any>) {
              updateService('update', item);
            },
            test: (connector, params, config) => {
							return sidebarContext.connector.test({ ...connector, connectorName: PLUGIN_CONNECTOR_NAME, mode: 'test' }, params, config);
						},
          }
        }) || null
			);
		} else if (sidebarContext.type === SERVICE_TYPE.HTTP) {
			node = (
				<DefaultPanel
					sidebarContext={sidebarContext}
					setRender={setRender}
					onSubmit={onFinish}
					key={sidebarContext.type + sidebarContext.formModel?.id}
					globalConfig={data.config}
					style={{ top: pluginRef.current?.getBoundingClientRect().top }}
				/>
			);
		} else if (sidebarContext.type === SERVICE_TYPE.FOLDER) {
			node = (
				<FolderPanel
					folder={sidebarContext.formModel}
					onClose={closeTemplateForm}
					onSubmit={onFolderFinish}
					style={{ top: pluginRef.current?.getBoundingClientRect().top }}
				/>
			);
		} else if (sidebarContext.type === SERVICE_TYPE.JS) {
			node = (
				<JsPanel
					key={sidebarContext.activeId}
					js={sidebarContext.formModel}
					onClose={closeTemplateForm}
					onSubmit={onJsFinish}
					style={{ top: pluginRef.current?.getBoundingClientRect().top }}
				/>
			)
		} 
		// else if (sidebarContext.type === 'addCom') {
		// 	node = (
		// 		<ComsPanel
		// 			key={sidebarContext.activeId}
		// 			model={sidebarContext.formModel}
		// 			onClose={closeTemplateForm}
		// 			onSubmit={onComsFinish}
		// 			style={{ top: pluginRef.current?.getBoundingClientRect().top }}
		// 		/>
		// 	)
		// }

		return node;
  }, [sidebarContext, sidebarContext.type, serviceListUrl, updateService, onFolderFinish]);

  const renderGlobalPanel = useCallback(() => {
    return sidebarContext.type === GLOBAL_PANEL ? (
      <GlobalPanel
        style={{ top: pluginRef.current?.getBoundingClientRect().top }}
        onClose={closeTemplateForm}
        data={data}
      />
    ) : null;
  }, [sidebarContext]);

  const getInterfaceParams = useCallback((item) => {
    if (item.type === SERVICE_TYPE.TG) {
      return interfaceParams.filter(
        ({ key }) =>
          !['content.path', 'content.method', 'content.desc'].includes(key)
      );
    } else if (item.type === SERVICE_TYPE.JS) {
			return interfaceParams.filter(
        ({ key }) =>
          !['content.path', 'content.method', 'content.doc'].includes(key)
      ); 
		}
    return interfaceParams;
  }, []);

  const initData = useCallback(() => {
    if (data.connectors.length === 0 && initialValue.serviceList?.length) {
      data.connectors = initialValue.serviceList;
      initialValue.serviceList.forEach((item: any) => {
        const { title, inputSchema, outputSchema } = item.content || {};
        const ctr = {
          id: item.id,
          type: sidebarContext.formModel.type || sidebarContext.type || SERVICE_TYPE.HTTP,
          title,
					connectorName: PLUGIN_CONNECTOR_NAME,
					globalMock: data.config.globalMock,
          inputSchema,
          outputSchema,
        };
        try {
          sidebarContext.connector.add(ctr);
        } catch (error) {
          console.log(error);
        }
      });
    }
  }, []);

	const onChangeGlobalMock = useCallback((globalMock) => {
		data.config.globalMock = globalMock;
	}, []);

	const onDoubleClick = useCallback(() => {
		copyText(JSON.stringify({
			pluginData: data,
			designerData: sidebarContext.addActions
				.reduce((pre, item) => ({ ...pre, [item.type]: sidebarContext.connector.getAllByType(item.type) }), {}),
		}))
	}, [data, sidebarContext]);

  useMemo(() => {
		if (!data) {
			return;
		}
    initData();
		try {
			const allConnectors = getConnectorsByTree(data.connectors);
			sidebarContext.addActions
				.reduce((pre, item) => [...pre, ...(sidebarContext.connector.getAllByType(item.type))], [])
				.forEach(designerConnector => {
					const pluginConnector = allConnectors?.find(con => con.id === designerConnector.id);

						if (!pluginConnector) {
							sidebarContext.connector.remove(designerConnector.id);
						} else if (pluginConnector.content.title !== designerConnector.title) {
							sidebarContext.connector.update({ ...designerConnector, title: pluginConnector.content.title });
						}
					});
		} catch (e) {
			console.log('连接器数据 format 失败', e);
		}
  }, []);

	const onDrop = useCallback((dragItem, dropItem, place: 'bottom' | 'top' | 'inner') => {
		const { parent: dragParent, index: dragIndex } = findConnector(data.connectors, dragItem);
		dragParent.splice(dragIndex, 1);
		const { parent: dropParent, index: dropIndex } = findConnector(data.connectors, dropItem);

		if (place === 'inner') {
			dropItem.children.push(dragItem);
		} else {
			dropParent.splice(place === 'bottom' ? dropIndex + 1 : dropIndex, 0, dragItem);
		}
	}, [data]);

	// const onDragEnd = useCallback(() => {
	// 	setAddComPanelContext((context) => {
	// 		return {
	// 			...context,
	// 			addPanel: false,
	// 		}
	// 	})
	// }, [])

	// const onDragStart = useCallback((item) => {
	// 	if ([SERVICE_TYPE.HTTP, SERVICE_TYPE.JS].includes(item.type)) {
	// 		globalContext.current.dragItem = item;
	// 		setAddComPanelContext((context) => {
	// 			return {
	// 				...context,
	// 				addPanel: true,
	// 			}
	// 		})
	// 	}
	// }, [])

	const renderItem = (connectors: any[], parent) => {
		return connectors?.length
			? connectors
				.map(item => {
					const expand = expandIdList.includes(item.id);
					item.updateTime = formatDate(item.updateTime || item.createTime);
					const { type } = item;
					const curAction = sidebarContext.addActions.find(action => action.type === type);
					let typeLabel = '接口';

					if (sidebarContext.addActions.length > 1) {
						typeLabel = curAction?.title || typeLabel;
					}
					const curTitle = curAction?.getTitle?.(item) || item.content.title;

					return (
						<>
							<Drag key={item.id} item={item} draggable onDrop={onDrop} 
							// onDragEnd={onDragEnd} 
							// onDragStart={onDragStart}
							>
								<div
									key={item.id}
									className={`${styles['sidebar-panel-list-item']} ${sidebarContext.activeId === item.id ? styles.active : ''} ${
										sidebarContext.isEdit
											? sidebarContext.activeId === item.id
												? styles.chose
												: styles.disabled
											: ''
									}`}
								>
									<div>
										<div
											onClick={() => onItemClick(item)}
											className={styles['sidebar-panel-list-item__left']}
										>
											<div className={`${styles.icon} ${expand ? styles.iconExpand : ''}`}>
												{Icons.arrowR}
											</div>
											{type === SERVICE_TYPE.FOLDER ? <div className={styles.folder}>{folder}</div> : <div className={styles.tag}>{typeLabel}</div>}
											<div className={styles.name}>
												<span data-mybricks-tip={curTitle || undefined}>{curTitle}</span>
											</div>
										</div>
										<div className={styles['sidebar-panel-list-item__right']}>
											{/* {type === SERVICE_TYPE.FOLDER ? null : (
												<div
													data-mybricks-tip="添加组件"
													ref={clickRef}
													className={styles.action}
													style={{ marginRight: 2 }}
													onClick={() => onAddComItem(item)}
												>
													{Icons.addCom}
												</div>
											)} */}
											<div
												data-mybricks-tip="编辑"
												ref={clickRef}
												className={styles.action}
												onClick={() => onEditItem(item)}
											>
												{Icons.edit}
											</div>
											{type === SERVICE_TYPE.FOLDER ? (
												<Dropdown
													dropDownStyle={{ right: 0 }}
													onBlur={fn => blurMap.current['toolbar' + item.id] = fn}
													overlay={(
														<div className={styles.dropdownItem}>
															{sidebarContext.addActions.map(({ type, title }: any) => {
																if (type === SEPARATOR_TYPE) {
																	return <div className={styles['separator-divider']}></div>
																}
																return (
																	<div
																		className={styles.item}
																		key={type}
																		onClick={() => {
																			sidebarContext.activeId = void 0;
																			sidebarContext.parent = item;

																			if (type === SERVICE_TYPE.HTTP) {
																				sidebarContext.addDefaultService();
																			} else if (type === SERVICE_TYPE.FOLDER) {
																				sidebarContext.addServiceFolder();
																			} else if(type === SERVICE_TYPE.IMPORT) {
																				sidebarContext.importService()
																			} else if (type === SERVICE_TYPE.JS) {
																				sidebarContext.addDefaultJs();
																			} else {
																				sidebarContext.type = type;
																				sidebarContext.isEdit = false;
																				sidebarContext.formModel = { type };
																				setRender(sidebarContext);
																			}
																		}}
																	>
																		{title}
																	</div>
																);
															})}
														</div>
													)}
												>
													<div
														className={styles.action}
														data-mybricks-tip="创建接口"
														onClick={() => Object.keys(blurMap.current).filter(key => key !== `toolbar${item.id}`).forEach(key => blurMap.current[key]())}
													>
														{plus}
													</div>
												</Dropdown>
											) : (
												<div data-mybricks-tip="复制" className={styles.action} onClick={() => onCopyItem(item, parent)}>
													{Icons.copy}
												</div>
											)}
											<div data-mybricks-tip="导出" className={styles.action} onClick={() => onExportItem(item)}>
												{Icons.exportIcon}
											</div>
											<div
												data-mybricks-tip="删除"
												className={styles.action}
												onClick={() => onRemoveItem(item)}
											>
												{Icons.remove}
											</div>
										</div>
									</div>
								</div>
							</Drag>
							{expand ? (
								type === SERVICE_TYPE.FOLDER
									? <div className={styles.folderList}>{renderItem(item.children, item)}</div>
									: (
										<div className={styles['sidebar-panel-list-item__expand']}>
											{getInterfaceParams(item).map((param: any) => {
												return (
													<div className={styles['sidebar-panel-list-item__param']} key={param.key}>
			                      <span
				                      className={styles['sidebar-panel-list-item__name']}
				                      style={{ width: param.width }}
			                      >
			                        {param.name}:
			                      </span>
																<span className={styles['sidebar-panel-list-item__content']}>
			                        {renderParam(item, param)}
			                      </span>
													</div>
												);
											})}
										</div>
									)
							) : null}
						</>
					);
				})
			: (
				<Drag parent={parent} item={null} draggable onDrop={onDrop} 
				// onDragEnd={onDragEnd} 
				// onDragStart={onDragStart}
				>
					<div className={styles.empty} style={parent ? { borderBottom: '1px solid #ccc' } : undefined}>暂无接口，请点击新建接口</div>
				</Drag>
			);
	};

	useEffect(() => {
		if (visibility === 'hidden') {
			closeTemplateForm();
		}
	}, [visibility]);

  return (
	  <div
		  ref={pluginRef}
		  data-id="plugin-root-panel"
		  className={`${styles['sidebar-panel']} ${styles['sidebar-panel-open']}`}
		  onClick={() => Object.values(blurMap.current).forEach(fn => fn())}
	  >
		  <div className={`${styles['sidebar-panel-view']}`}>
			  <div className={styles['sidebar-panel-header']}>
				  <div className={styles['sidebar-panel-header__title']}>
					  <span onDoubleClick={onDoubleClick}>连接器</span>
					  <div className={styles.rightOperate}>
						  <div className={styles.globalMock} data-mybricks-tip="开启全局Mock，页面调试时所有接口将默认使用Mock能力">
							  <span className={data?.config?.globalMock ? styles.warning : ''}>全局 Mock:</span>
							  <Switch defaultValue={data?.config?.globalMock} onChange={onChangeGlobalMock} />
						  </div>
						  <div className={styles.icon} onClick={onGlobalConfigClick} data-mybricks-tip="全局设置，可定义接口全局处理逻辑">
							  {Icons.set}
						  </div>
					  </div>
				  </div>
				  <Toolbar
					  blurMap={blurMap.current}
					  searchValue={searchValue}
					  ctx={sidebarContext}
					  setRender={setRender}
				  />
			  </div>
			  <div className={styles['sidebar-panel-list']}>
				  {renderItem(filterConnectorsByKeyword(data?.connectors, searchValue), null)}
			  </div>
		  </div>
		  {renderAddActions()}
		  {renderGlobalPanel()}
			{/* <AddComPanel
				visible={addComPanelContext.addPanel}
				globalContext={globalContext.current}
				sidebarContext={sidebarContext}
			/> */}
	  </div>
  );
};

export default Plugin;
