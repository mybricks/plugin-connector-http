import React, { FC, ReactNode, useLayoutEffect, useRef } from 'react';

import styles from './index.less';

interface DragProps {
	children: ReactNode;
	item: any;
	parent?: any;
	draggable?: boolean;
	onDrop(dragItem: any, dropItem: any, place: 'bottom' | 'top' | 'inner'): void;
	onDragEnd?(): void;
	onDragStart?(dragItem: any): void;
}

let dragItem = null;
const Drag: FC<DragProps> = props => {
	const { children, item, draggable, onDrop, parent, onDragEnd, onDragStart } = props;
	const dragRef = useRef<HTMLDivElement>(null);
	const heightRef = useRef(0);
	const topRef = useRef(0);
	const shouldCalcRect = useRef(true);

	useLayoutEffect(() => {
		const { current } = dragRef;
		heightRef.current = current.clientHeight;

		current.addEventListener('dragstart', (event) => {
			dragItem = item;
			onDragStart?.(item);
		});
		current.addEventListener('dragover', (event) => {
			if (shouldCalcRect.current) {
				topRef.current = current.getBoundingClientRect().y;
				shouldCalcRect.current = false;
			}
			if (dragItem && event.currentTarget && (!item || dragItem?.id !== item.id)) {
				const currentTarget = event.currentTarget as HTMLDivElement;
				currentTarget.classList.remove(styles.hovering, styles.hoverTop, styles.hoverBottom);
				currentTarget.classList.add(styles.hovering, event.y >= (topRef.current + heightRef.current / 2) ? styles.hoverBottom : styles.hoverTop);
			}
			event.preventDefault();
			event.stopPropagation();
		});
		current.addEventListener('dragleave', (event) => {
			if (dragItem && event.currentTarget && (!item || dragItem?.id !== item.id)) {
				(event.currentTarget as HTMLDivElement).classList.remove(styles.hovering, styles.hoverTop, styles.hoverBottom);
			}
			shouldCalcRect.current = true;
			event.stopPropagation();
		});
		current.addEventListener('dragend', (event) => {
			onDragEnd?.();
			if (dragItem && event.currentTarget && (!item || dragItem?.id !== item.id)) {
				(event.currentTarget as HTMLDivElement).classList.remove(styles.hovering, styles.hoverTop, styles.hoverBottom);
			}
			dragItem = null;
			shouldCalcRect.current = true;
		});
		current.addEventListener('drop', (event) => {
			event.preventDefault();
			if (dragItem && event.currentTarget && (!item || dragItem?.id !== item.id)) {
				(event.currentTarget as HTMLDivElement).classList.remove(styles.hovering, styles.hoverTop, styles.hoverBottom);
				onDrop(dragItem, parent || item, (parent ? 'inner' : (event.y >= (topRef.current + heightRef.current / 2) ? 'bottom' : 'top')));
			}
			dragItem = null;
			shouldCalcRect.current = true;
		});
	}, []);

	return (
		<div ref={dragRef} draggable={draggable}>
			{children}
		</div>
	);
};

export default Drag;