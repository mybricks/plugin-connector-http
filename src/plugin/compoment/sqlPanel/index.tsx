import React, {useCallback, useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Button from '../../../components/Button';
import {exampleSQLParamsFunc, NO_PANEL_VISIBLE, SQL_PANEL_VISIBLE} from '../../../constant';
import Collapse from '../../../components/Collapse';
import { choose } from '../../../icon';
import Loading from '../loading';
import { parseQuery, uuid } from '../../../utils';

import css from '../../../../src/style-cssModules.less';
import curCss from './index.less';

export default function SQLPanel({
  sidebarContext,
  style,
  data,
  updateService,
  serviceListUrl,
  callServiceUrl,
  setRender,
}: any) {
  const [originSQLList, setOriginSQList] = useState([]);
  const [selectedSQLList, setSelectedSQLList] = useState([]);
  const [loading, setLoading] = useState(false);
  const onItemClick = useCallback((item) => {
    if (data.connectors.some(({ id }) => item.serviceId === id)) return;
    setSelectedSQLList((sql) => {
      if (sql.some(({ serviceId }) => item.serviceId === serviceId)) {
        sql = sql.filter(({ serviceId }) => serviceId !== item.serviceId);
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
	const baseFileId = parseQuery(location.search)?.id;
	const fetchRelativePath = useCallback(async (relativeId): Promise<unknown> => {
		return new Promise((resolve) => {
			axios({
				url: serviceListUrl || '/paas/api/file/getRelativePathBetweenFileId',
				method: 'POST',
				data: {
					baseFileId: baseFileId,
					relativeId
				}
			})
			.then((res) => res.data)
			.then((res) => {
				if (res.code === 1) {
					resolve(res.data)
				}
			});
		})
	}, [])
	const onSaveSQl = useCallback(async (sqlList: any[]) => {
		setRender({
			panelVisible: NO_PANEL_VISIBLE,
		});
		for(let l = sqlList.length, i=0; i<l; i++) {
			const item = sqlList[i]
			const relativePath: string = (await fetchRelativePath(item.fileId)) as string;
			const inputSchema = item.paramAry?.reduce((obj, cur) => {
				obj[cur.name] = { type: cur.type };
				return obj;
			}, {});
			const debugParams = item.paramAry?.map((item) => ({
				id: uuid(),
				name: item.name,
				type: item.type,
				defaultValue: item.debugValue,
			}));
			
			updateService('create', {
        id: item.serviceId,
        title: item.title,
        method: 'POST',
        type: 'http-sql',
        inputSchema: {
          type: 'object',
          properties: {
            ...inputSchema,
          },
        },
        resultSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
            },
            data: {
              type: 'object',
            },
            msg: {
              type: 'string',
            },
          },
        },
        domainServiceMap: {
          serviceId: item.serviceId,
          relativePath: relativePath,
          baseFileId: baseFileId
        },
        params: debugParams
          ? {
              type: 'root',
              name: 'root',
              children: debugParams,
            }
          : void 0,
        input: encodeURIComponent(
          exampleSQLParamsFunc
            .replace('__serviceId__', item.serviceId)
            .replace('__relativePath__', relativePath)
            // .replace('__fileId__', item.fileId)
            // .replace('__baseFileId__', baseFileId)
        ),
        path: callServiceUrl || `/api/system/domain/run`,
      });
		}
	}, []);
	
	useEffect(() => {
		function fetchServiceList() {
			setLoading(true);
			axios({
				url: serviceListUrl || '/paas/api/system/domain/list',
				method: 'POST',
				data: {
					fileId: baseFileId
				}
			})
			.then((res) => res.data)
			.then((res) => {
				if (res.code === 1) {
					setOriginSQList(res.data);
				}
			})
			.finally(() => setLoading(false));
		}
		
		(sidebarContext.panelVisible & SQL_PANEL_VISIBLE) && fetchServiceList();
	}, [sidebarContext.panelVisible]);
	
  return ReactDOM.createPortal(
    sidebarContext.panelVisible & SQL_PANEL_VISIBLE ? (
      <div
        style={{
          left: 361,
          ...style,
        }}
        className={`${css['sidebar-panel-edit']}`}
      >
        <div className={css['sidebar-panel-title']}>
          <div>接口选择</div>
          <div>
            <div className={css['actions']}>
              <Button size='small' type={selectedSQLList.length ? 'primary' : ''}  onClick={onSave}>
                保 存
              </Button>
            </div>
          </div>
        </div>
        <div className={curCss.ct}>
          {loading ? <Loading /> : originSQLList?.map((sql) => (
	          <Collapse header={sql.fileName} defaultFold={false}>
		          {sql.serviceList.map((item) => (
			          <div
				          key={item.serviceId}
				          className={
					          selectedSQLList.some(
						          ({ serviceId }) => item.serviceId === serviceId
					          ) || data.connectors.some(({ id }) => item.serviceId === id)
						          ? curCss.selected
						          : curCss.item
				          }
				          onClick={() => onItemClick({ ...item, fileId: sql.fileId })}
			          >
				          <div>{item.title}</div>
				          <div className={curCss.right}>{choose}</div>
			          </div>
		          ))}
	          </Collapse>
          ))}
        </div>
      </div>
    ) : null,
    document.body
  );
}
