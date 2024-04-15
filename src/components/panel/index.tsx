import React, {
	CSSProperties,
	forwardRef,
	ForwardRefRenderFunction,
	ReactNode,
	useCallback,
	useImperativeHandle,
	useRef
} from 'react';
import ReactDOM from 'react-dom';
import Button from '../Button';

import styles from './index.less';

export interface PanelWrapProps {
	style?: CSSProperties;
	className?: string;
	title?: string;
	extra?: ReactNode;
	onClose?(): void;
	children?: ReactNode;
}

export interface PanelWrapRef {
	registerBlur(key: string, blur: () => void): void;
}

const PanelWrap: ForwardRefRenderFunction<PanelWrapRef, PanelWrapProps> = (props, ref) => {
	const { children, style, className = '', title = '', extra = null, onClose } = props;
	const blurMapRef = useRef<Record<string, () => void>>({});

	const onBlurAll = useCallback(() => Object.values(blurMapRef.current).forEach(blur => blur?.()), []);
	useImperativeHandle(ref, () => {
		return {
			registerBlur: (key, blur) => {
				blurMapRef.current = { ...blurMapRef.current, [key]: blur };
			}
		};
	}, [])

	return ReactDOM.createPortal(
			<div
				data-id="plugin-panel"
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
			document.querySelector('div[data-id=plugin-root-panel]') as HTMLElement
		);
};

export default forwardRef(PanelWrap);
