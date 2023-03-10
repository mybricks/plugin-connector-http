import React, {CSSProperties, FC, useCallback, useEffect, useMemo, useState} from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {DOMAIN_PANEL_VISIBLE, NO_PANEL_VISIBLE} from '../../../constant';
import Button from '../../../components/Button';
import {parseQuery} from '../../../utils';
import Loading from '../loading';
import {choose} from '../../../icon';
import Collapse from '../../../components/Collapse';

import styles from './index.less';

interface DomainPanelProps {
	style: CSSProperties;
	setRender(value: Record<string, unknown>): void;
	sidebarContext: Record<string, unknown>;
	updateService(action: string, entity: any): void;
	data: any;
}

interface Domain {
	fileId: number;
	fileName: string;
	entityList: Array<{ id: string; name: string; isSystem: boolean }>;
}
interface Entity {
	id: string;
	name: string;
	isSystem: boolean;
	domainFileId: number;
	domainFileName: string;
	[key: string]: any;
}

const DomainPanel: FC<DomainPanelProps> = props => {
	const { style, setRender, data, updateService, sidebarContext } = props;
	const [domainList, setDomainList] = useState<Domain[]>([]);
	const [selectedEntityList, setSelectedEntityList] = useState<Entity[]>([]);
	const [loading, setLoading] = useState(false);
	const baseFileId = useMemo(() => parseQuery(location.search)?.id, []);
	
	const onSave = useCallback(() => {
		setSelectedEntityList((entityList => {
			entityList.forEach(item => {
				updateService('create', {
					id: item.id,
					type: 'domain',
					title: item.desc,
					script: JSON.stringify(item)
				})
			})
			setRender({
				panelVisible: NO_PANEL_VISIBLE,
			});
			return [];
		}));
	}, []);
	
	const onItemClick = useCallback((item) => {
		if (data.connectors.some(({ id, domainFileId }) => item.id === id && domainFileId === item.domainFileId)) return;
		setSelectedEntityList((preEntityList) => {
			if (preEntityList.some(({ id, domainFileId }) => item.id === id && domainFileId === item.domainFileId)) {
				preEntityList = preEntityList.filter(({ id, domainFileId }) => id !== item.id || domainFileId !== item.domainFileId);
			} else {
				preEntityList.push(item);
			}
			
			return [...preEntityList];
		});
	}, []);
	
	useEffect(() => {
		function fetchDomainList() {
			setLoading(true);
			axios({
				url: '/paas/api/system/domain/entity/list',
				method: 'POST',
				data: {
					fileId: baseFileId
				}
			})
			.then((res) => res.data)
			.then((res) => {
				if (res.code === 1) {
					setDomainList(res.data || []);
				}
			})
			.finally(() => setLoading(false));
		}
		
		(sidebarContext.panelVisible & DOMAIN_PANEL_VISIBLE) && fetchDomainList();
	}, [sidebarContext.panelVisible]);
	
  return ReactDOM.createPortal(
	  sidebarContext.panelVisible & DOMAIN_PANEL_VISIBLE ? (
			<div className={styles.sidebarPanelEdit} style={{ ...style, left: 361 }}>
				<div className={styles.sidebarPanelTitle}>
					<div>模型实体选择</div>
					<div>
						<div className={styles['actions']}>
							<Button size='small' type={selectedEntityList.length ? 'primary' : ''}  onClick={onSave}>
								保 存
							</Button>
						</div>
					</div>
				</div>
				<div className={styles.ct}>
					{loading ? <Loading /> : domainList.map(domain => (
						<Collapse header={domain.fileName} key={domain.fileId} defaultFold={false}>
							{domain.entityList.filter(entity => !entity.isSystem).map((entity) => {
								const selected = selectedEntityList.some(({ id, domainFileId}) => entity.id === id && domainFileId === domain.fileId)
									|| data.connectors.some(({ id, domainFileId }) => entity.id === id && domainFileId === domain.fileId);
								
								return (
									<div
										key={entity.id}
										className={selected ? styles.selected : styles.item}
										onClick={() => onItemClick({
											...entity,
											domainFileId: domain.fileId,
											domainFileName: domain.fileName
										})}
									>
										<div>{entity.name}</div>
										<div className={styles.right}>{choose}</div>
									</div>
								);
							})}
						</Collapse>
					))}
				</div>
			</div>
	  ) : null,
	  document.body
  );
};

export default DomainPanel;