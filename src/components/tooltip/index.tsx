import React, { FC } from 'react';

import styles from './index.less';

interface TooltipProps {
	content: string;
}

const Tooltip: FC<TooltipProps> = props => {
	const { content, children } = props;

	return (
		<span className={styles.tooltipContainer}>
			{children}
			<div className={styles.tooltip}>
				{content}
			</div>
			<div className={styles.arrow}></div>
		</span>
	);
};

export default Tooltip;
