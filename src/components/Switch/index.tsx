import React, { useState, useCallback, FC } from 'react';

import styles from './index.less';

export interface SwitchProps {
  defaultValue?: boolean;
  onChange?(value: boolean): void;
}

const Switch: FC<SwitchProps> = ({ defaultValue = false, onChange }) => {
  const [checked, setChecked] = useState<boolean>(defaultValue);

  const onClick = useCallback(() => {
    setChecked(!checked);
    onChange?.(!checked);
  }, [checked, onChange]);

  return (
    <div className={styles.ct}>
      <button
        onClick={onClick}
        className={`${styles.switch} ${checked ? styles.checked : ''}`}
      >
        <div className={styles.handle}></div>
      </button>
    </div>
  );
};
export default Switch;
