import React, {CSSProperties, FC, useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {DOMAIN_PANEL_VISIBLE, NO_PANEL_VISIBLE} from '../../../constant';
import Button from '../../../components/Button';
import Loading from '../loading';

import styles from './index.less';

interface DomainPanelProps {
	style: CSSProperties;
	setRender(value: Record<string, unknown>): void;
	sidebarContext: any;
	updateService(action: string, entity: any): void;
	data: any;
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
	const [domainFile, setDomainFile] = useState(null);
	const [entityList, setEntityList] = useState<Entity[]>([]);
	const [selectedEntityList, setSelectedEntityList] = useState<Entity[]>([]);
	const [loading, setLoading] = useState(false);
	const domainFileRef = useRef(null);
	
	const onSave = useCallback(() => {
		setSelectedEntityList((entityList => {
			entityList.forEach(item => {
				updateService('create', {
					id: item.id,
					type: 'domain',
					title: item.name,
					script: JSON.stringify(item)
				})
			})
			domainFileRef.current = null;
			setDomainFile(null);
			return [];
		}));
	}, []);
	
	const onItemClick = useCallback((item) => {
		if (data.connectors.some(({ id }) => item.id === id)) return;
		setSelectedEntityList((preEntityList) => {
			if (preEntityList.some(({ id }) => item.id === id)) {
				preEntityList = preEntityList.filter(({ id }) => id !== item.id);
			} else {
				preEntityList.push(item);
			}
			
			return [...preEntityList];
		});
	}, []);
	
	const getBundle = useCallback((fileId: number) => {
		setLoading(true);
		axios.get(`/paas/api/domain/bundle?fileId=${fileId}`)
		.then((res) => {
			if (res.data.code === 1) {
				setEntityList(res.data.data.entityAry.filter(entity => entity.isOpen).map(entity => ({ ...entity, id: 'domain_' + entity.id })));
			}
		})
		.finally(() => setLoading(false));
	}, [])
	
	useEffect(() => {
		if (sidebarContext.panelVisible & DOMAIN_PANEL_VISIBLE) {
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
			<div className={styles.sidebarPanelEdit} data-id="plugin-panel" style={{ ...style, left: 361 }}>
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
					{loading ? <Loading /> : (
						entityList?.length
							? entityList.map(entity => {
									const selected = selectedEntityList.some(({ id}) => entity.id === id)
										|| data.connectors.some(({ id }) => entity.id === id);
									
									return (
										<div
											key={entity.id}
											className={selected ? styles.selected : styles.item}
											onClick={() => onItemClick({
												...entity,
												domainFileId: domainFile.id,
												domainFileName: domainFile.name
											})}
										>
											<input type="checkbox" />
											<div>{entity.name}</div>
										</div>
									);
								})
							: <div className={styles.empty}>暂无可添加的领域模型实体</div>
					)}
				</div>
			</div>
	  ) : null,
	  document.body
  );
};

export default DomainPanel;