import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Button from '../../../components/Button';
import {exampleOpenSQLParamsFunc, exampleSQLParamsFunc, NO_PANEL_VISIBLE, SQL_PANEL_VISIBLE} from '../../../constant';
import Loading from '../loading';
import { uuid } from '../../../utils';
import Collapse from '../../../components/Collapse';

import css from '../../../../src/style-cssModules.less';
import curCss from './index.less';

/** 字段类型 */
enum FieldBizType {
	STRING = 'string',
	NUMBER = 'number',
	DATETIME = 'datetime',
	/** 超链接 */
	HREF = 'href',
	/** 电话 */
	PHONE = 'phone',
	/** 邮箱 */
	EMAIL = 'email',
	/** 图片 */
	IMAGE = 'image',
	/** 附件 */
	APPEND_FILE = 'appendFile',
	/** 枚举 */
	ENUM = 'enum',
	/** 外键，关联其他表 */
	RELATION = 'relation',
	/** 映射其他表 */
	MAPPING = 'mapping',
	/** 系统表 */
	SYS_USER = 'SYS_USER',
	/** 系统表 */
	SYS_USER_CREATOR = 'SYS_USER.CREATOR',
	/** 系统表 */
	SYS_USER_UPDATER = 'SYS_USER.UPDATER',
}
const getSchemaTypeByFieldType = (field) => {
	switch (field.bizType) {
		case FieldBizType.ENUM:
			return 'enum';
		case FieldBizType.DATETIME:
			return field.showFormat ? 'string' : 'number';
		case FieldBizType.STRING:
			return 'string';
		case FieldBizType.NUMBER:
			return 'number';
		case FieldBizType.HREF:
			return 'string';
		case FieldBizType.PHONE:
			return 'string';
		case FieldBizType.EMAIL:
			return 'string';
		case FieldBizType.IMAGE:
			return 'string';
		case FieldBizType.APPEND_FILE:
			return 'string';
		case FieldBizType.RELATION:
			return 'number';
		case FieldBizType.SYS_USER:
			return 'number';
		case FieldBizType.SYS_USER_CREATOR:
			return 'number';
		case FieldBizType.SYS_USER_UPDATER:
			return 'number';
	}
};
export default function SQLPanel({
  sidebarContext,
  style,
  data,
  updateService,
  serviceListUrl,
  callServiceUrl,
  setRender,
}: any) {
  const [domainFile, setDomainFile] = useState(null);
  const [originSQLList, setOriginSQList] = useState([]);
  const [entityList, setEntityList] = useState([]);
  const [selectedSQLList, setSelectedSQLList] = useState([]);
  const [loading, setLoading] = useState(false);
	const domainFileRef = useRef(null);
	
  const onItemClick = useCallback((item) => {
    if (data.connectors.some(({ id }) => item.id === id)) return;
    setSelectedSQLList((sql) => {
      if (sql.some(({ id }) => item.id === id)) {
        sql = sql.filter(({ id }) => id !== item.id);
      } else {
        sql.push(item);
      }
      return [...sql];
    });
  }, []);

  const onSave = () => {
    onSaveSQl(selectedSQLList).catch(e => console.log(e));
    setSelectedSQLList([]);
  }
	const onSaveSQl = useCallback(async (sqlList: any[]) => {
		setDomainFile(null);
		domainFileRef.current = null;
		
		for(let l = sqlList.length, i=0; i<l; i++) {
			const item = sqlList[i]
			const fileId = item.fileId;
			const isOpen = item.id.endsWith('_SELECT');
			const entityId = item.id.replace('_SELECT', '');
			const entity = isOpen ? entityList.find(entity => entity.id === entityId) : null;
			
			const inputSchema = item.inputSchema || { type: 'any' };
			let outputSchema = item.outputSchema || { type: 'any' };
			
			if (isOpen) {
				outputSchema = { type: 'array', items: { type: 'object', properties: {} } };
				
				try {
					item.originEntity?.fieldAry
					.filter(field => field.bizType !== 'mapping' && !field.isPrivate && ['string', 'number', 'datetime', 'relation', 'SYS_USER', 'SYS_USER.CREATOR', 'SYS_USER.UPDATER'].includes(field.bizType))
					.forEach(field => {
						if (field.mapping?.entity?.fieldAry.length) {
							outputSchema.items.properties[field.name] = { type: 'object', properties: {} };
							field.mapping.entity.fieldAry.forEach(mappingField => {
								outputSchema.items.properties[field.name].properties[mappingField.name] = { type: getSchemaTypeByFieldType(mappingField) };
							});
						} else {
							outputSchema.items.properties[field.name] = { type: getSchemaTypeByFieldType(field) };
						}
					});
				} catch (e) {
					console.log('parse outputSchema error', e);
				}
			}
			
			const debugParams = item.paramAry?.map((item) => ({
				id: uuid(),
				name: item.title,
				type: item.type,
				defaultValue: item.debugValue,
			}));
			
			updateService('create', {
        id: item.id,
        title: item.title,
        method: 'POST',
        type: 'http-sql',
        inputSchema: isOpen ? {
	        type: 'object',
	        properties: {
		        keyword: {
							type: 'string'
		        }
	        },
        } : inputSchema,
        outputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
            },
            data: outputSchema,
            msg: {
              type: 'string',
            },
          },
        },
        resultSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
            },
	          data: outputSchema,
            msg: {
              type: 'string',
            },
          },
        },
        domainServiceMap: {
          serviceId: item.id,
	        fileId
        },
        params: debugParams
          ? {
              type: 'root',
              name: 'root',
              children: debugParams,
            }
          : void 0,
        input: encodeURIComponent(
          isOpen
	          ? exampleOpenSQLParamsFunc
	            .replace('__serviceId__', entityId)
	            .replace('__fileId__', item.fileId)
		          .replace('__fields__', JSON.stringify(entity.fieldAry.filter(field => field.bizType !== 'mapping' && !field.isPrivate && ['string', 'number', 'datetime', 'relation', 'SYS_USER', 'SYS_USER.CREATOR', 'SYS_USER.UPDATER'].includes(field.bizType)).map(field => ({ name: field.name }))))
	          : exampleSQLParamsFunc
              .replace('__serviceId__', item.id)
              .replace('__fileId__', item.fileId)
            // .replace('__baseFileId__', baseFileId)
        ),
        path: callServiceUrl || `/api/system/domain/run`,
      });
		}
	}, [entityList]);
	
	const getBundle = useCallback((fileId: number) => {
			setLoading(true);
			axios.get(`/paas/api/domain/bundle?fileId=${fileId}`)
			.then((res) => {
				if (res.data.code === 1) {
					setOriginSQList([
						...res.data.data.service,
						...res.data.data.entityAry.filter(entity => entity.isOpen).map(entity => ({ id: entity.id, entityName: entity.name, title: `${entity.name}的领域服务`, originEntity: entity,  isOpen: true }))
					]);
					setEntityList(res.data.data.entityAry);
				}
			})
			.finally(() => setLoading(false));
		}, [])
	
	useEffect(() => {
		if (sidebarContext.panelVisible & SQL_PANEL_VISIBLE) {
			if (domainFileRef.current) {
				domainFileRef.current = null;
				setDomainFile(null);
			}
			sidebarContext.openFileSelector?.()
			.then(file => {
				domainFileRef.current = file;
				setDomainFile(file);
				
				file && getBundle(file.id);
			})
			.finally(() => {
				setRender({ panelVisible: NO_PANEL_VISIBLE });
			});
		} else if (sidebarContext.panelVisible !== NO_PANEL_VISIBLE) {
			domainFileRef.current = null;
			setDomainFile(null);
		}
	}, [sidebarContext.panelVisible, setRender]);
	
  return ReactDOM.createPortal(
	  !!domainFile ? (
      <div style={{ left: 361, ...style }} data-id="plugin-panel" className={`${css['sidebar-panel-edit']}`}>
        <div className={css['sidebar-panel-title']}>
          <div>领域接口选择</div>
          <div>
            <div className={css['actions']}>
              <Button size='small' type={selectedSQLList.length ? 'primary' : ''}  onClick={onSave}>
                保 存
              </Button>
            </div>
          </div>
        </div>
        <div className={curCss.ct}>
          {loading ? <Loading /> : (
	          originSQLList?.length
		          ? originSQLList?.map((sql) => {
			          const selected = sql.isOpen ? false : (selectedSQLList.some(({ id }) => sql.id === id) || data.connectors.some(({ id }) => sql.id === id));
			
			          return sql.isOpen ? (
				          <Collapse style={{ fontSize: '14px' }} headerClassName={{ height: '36px' }} header={sql.title} defaultFold={false}>
					          {['SELECT'].map((key) => {
						          // ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
						          const curId = sql.id + '_' + key;
						          const keyMap = {
							          INSERT: '创建接口',
							          UPDATE: '更新接口',
							          SELECT: '查询接口',
							          DELETE: '删除接口',
						          };
						          const selected = selectedSQLList.some(({ id }) => id === curId) || data.connectors.some(({ id }) => id === curId);
						
						          return (
							          <div
								          key={curId}
								          style={{ marginLeft: '24px' }}
								          className={`${curCss.item} ${selected ? curCss.selected : ''}`}
								          onClick={() => onItemClick({ ...sql, title: `${sql.entityName}的${keyMap[key]}`, id: curId, fileId: domainFile.id })}
							          >
								          <input type="checkbox" />
								          <div>{sql.entityName}的{keyMap[key]}</div>
							          </div>
						          );
					          })}
				          </Collapse>
			          ) : (
				          <div
					          key={sql.id}
					          className={`${curCss.item} ${selected	? curCss.selected	: ''}`}
					          onClick={() => onItemClick({ ...sql, fileId: domainFile.id })}
				          >
					          <input type="checkbox" />
					          <div>{sql.title}</div>
				          </div>
			          );
		          })
		          : <div className={curCss.empty}>暂无可添加的领域接口</div>
          )}
        </div>
      </div>
    ) : null,
    document.body
  );
}
