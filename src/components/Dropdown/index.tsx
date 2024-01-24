import React, { useState, useCallback, useEffect, FC, CSSProperties, ReactNode } from 'react';

import styles from './index.less';

export interface DropdownProps {
	dropDownStyle?: CSSProperties;
	overlay?: ReactNode;
	onBlur?(blur: () => void): void;
	children?: ReactNode;
}

const Dropdown: FC<DropdownProps> = ({ dropDownStyle, children, overlay, onBlur }) => {
  const [visible, setVisible] = useState(false);
  const onClick = useCallback(event => {
	  event.stopPropagation();
    setVisible(visible => !visible);
  }, [])
	
	useEffect(() => {
		onBlur?.(() => setVisible(false));
	}, []);
	
  return (
    <div className={styles.dropdown}>
      <div onClick={onClick}>{children}</div>
      <div style={dropDownStyle} className={styles.content}>
        {visible ? overlay : null}
      </div>
    </div>
  );
};
export default Dropdown;