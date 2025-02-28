import React, { CSSProperties, FC, useCallback, useState } from 'react';
import PanelWrap from '../../../components/panel';
import FormItem from '../../../components/FormItem';
import Input from '../../../components/Input';
import { Collapse } from '../../../components';
import Button from '../../../components/Button';

interface FolderPanelProps {
	onClose(): void;
	style: CSSProperties;
	folder: { id: string; content: { title: string; } };
	onSubmit(folder: { id: string; content: { title: string; } }): void;
}

const FolderPanel: FC<FolderPanelProps> = ({ onClose, style, folder, onSubmit }) => {
	const [title, setTitle] = useState(folder.content.title);
	const [dotTip, setDotTip] = useState(false);
	const onSaveClick = useCallback(() => onSubmit({ ...folder, content: { ...folder.content, title } }), [title, folder, onSubmit]);

	const onTitleChange = (e) => {
		setTitle(e.target.value);
		setDotTip(true);
	}

	return (
		<PanelWrap style={style} title="新建文件夹" onClose={onClose} extra={<Button type="primary" size="small" dotTip={dotTip} onClick={onSaveClick}>保 存</Button>}>
			<Collapse header="基本信息" defaultFold={false}>
				<FormItem label='名称' require>
					<Input
						key='interfaceName'
						defaultValue={folder.content.title}
						onChange={onTitleChange}
						placeholder='文件夹的名称'
					/>
				</FormItem>
			</Collapse>
		</PanelWrap>
	);
};
export default FolderPanel
