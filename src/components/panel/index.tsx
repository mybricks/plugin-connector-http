import React, { CSSProperties, FC, ReactNode, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Button from '../Button';

import styles from './index.less';

export interface PanelWrapProps {
	blurMap?: Record<string, () => void>;
	style?: CSSProperties;
	className?: string;
	title?: string;
	extra?: ReactNode;
	onClose?(): void;
	children?: ReactNode;
}

const PanelWrap: FC<PanelWrapProps> = props => {
	const { children, blurMap = {}, style, className = '', title = '', extra = null, onClose } = props;

	const onBlurAll = useCallback(() => Object.values(blurMap).forEach(blur => blur?.()), [blurMap]);

	return ReactDOM.createPortal(
			<div
				data-id="plugin-panel"
				style={style}
				className={`${styles.pluginPanelContainer} ${className}`}
				onClick={onBlurAll}
			>
				<div className={styles.pluginPanelTitle}>
					<div>{title}</div>
					<div>
						{extra}
						<Button size="small" onClick={onClose}>
							关 闭
						</Button>
					</div>
				</div>
				<div className={styles.pluginPanelContent}>{children}</div>
			</div>,
			document.body
		);
};

export default PanelWrap;
