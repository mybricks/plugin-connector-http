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
  const [domainFile, setDomainFile] = useState(null);
  const [originSQLList, setOriginSQList] = useState([]);
  const [selectedSQLList, setSelectedSQLList] = useState([]);
  const [loading, setLoading] = useState(false);
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
		
		for(let l = sqlList.length, i=0; i<l; i++) {
			const item = sqlList[i]
			const fileId = item.fileId;
			
			const inputSchema = item.paramAry?.reduce((obj, cur) => {
				obj[cur.name] = { type: cur.type };
				return obj;
			}, {});
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
          exampleSQLParamsFunc
            .replace('__serviceId__', item.id)
            .replace('__fileId__', item.fileId)
            // .replace('__baseFileId__', baseFileId)
        ),
        path: callServiceUrl || `/api/system/domain/run`,
      });
		}
	}, []);
	const getBundle = useCallback((fileId: number) => {
			setLoading(true);
			axios.get(`/paas/api/domain/bundle?fileId=${fileId}`)
			.then((res) => {
				if (res.data.code === 1) {
					setOriginSQList([
						...res.data.data.service,
						...res.data.data.entityAry.filter(entity => entity.isOpen).map(entity => ({ id: entity.id, title: `${entity.name}的领域服务` }))
					]);
				}
			})
			.finally(() => setLoading(false));
		}, [])
	
	useEffect(() => {
		if (sidebarContext.panelVisible & SQL_PANEL_VISIBLE) {
			sidebarContext.openFileSelector()
			.then(file => {
				setDomainFile(file);
				
				file && getBundle(file.id);
			})
			.finally(() => {
				setRender({ panelVisible: NO_PANEL_VISIBLE });
			});
		}
	}, [sidebarContext.panelVisible, setRender]);
	
  return ReactDOM.createPortal(
	  !!domainFile ? (
      <div style={{ left: 361, ...style }} className={`${css['sidebar-panel-edit']}`}>
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
	          <div
		          key={sql.id}
		          className={
			          selectedSQLList.some(({ id }) => sql.id === id) || data.connectors.some(({ id }) => sql.id === id)
				          ? curCss.selected
				          : curCss.item
		          }
		          onClick={() => onItemClick({ ...sql, fileId: domainFile.id })}
	          >
		          <div>{sql.title}</div>
		          <div className={curCss.right}>{choose}</div>
	          </div>
          ))}
        </div>
      </div>
    ) : null,
    document.body
  );
}
