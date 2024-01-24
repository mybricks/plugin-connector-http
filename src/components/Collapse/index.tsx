import React, { useState, useCallback, FC, ReactNode, CSSProperties } from 'react';
import { arror } from '../../icon';

import styles from './index.less';

export interface CollapseProps {
	/** 默认关闭 */
	defaultFold?: boolean;
	/** 标题 */
	header?: ReactNode;
	/** 标题样式 */
	headerStyle?: CSSProperties;
	/** 内容容器样式 */
	contentStyle?: CSSProperties;
}

const Collapse: FC<CollapseProps> = ({ children, defaultFold = true, header, headerStyle, contentStyle, ...props }: any) => {
	const [fold, setFold] = useState<boolean>(defaultFold);
	const onHeaderClick = useCallback(() => setFold((fold) => !fold), []);

	return (
		<div className={styles.collapse} {...props}>
			<div className={`${styles.header}`} style={headerStyle} onClick={onHeaderClick}>
				<div className={`${styles.icon} ${fold ? styles.fold : ''}`}>{arror}</div>
				{header}
			</div>
	    {fold ? null : <div className={`${styles.content}`} style={contentStyle}>{children}</div>}
		</div>
	);
};

export default Collapse;
