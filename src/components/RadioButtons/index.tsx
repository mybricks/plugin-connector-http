import React, { FC, useEffect, useState } from 'react';

import styles from './index.less';

type ValueType = any;
export interface RadioButtonsProps {
  options: Array<{ title: string; value: ValueType }>;
  defaultValue: ValueType;
  onChange?(value: ValueType): void;
}

const RadioButtons: FC<RadioButtonsProps> = ({ options, defaultValue, onChange }) => {
  const [select, setSelect] = useState(defaultValue);

  useEffect(() => {
    setSelect(defaultValue);
  }, [defaultValue]);

  return (
    <div className={styles.edt}>
      {options.map((opt) => {
        return (
          <div
            key={opt.value}
            className={`${styles.opt} ${opt.value === select ? styles.selected : ''}`}
            onClick={() => {
              onChange?.(opt.value)
              setSelect(opt.value);
            }}
          >
            {opt.title}
          </div>
        );
      })}
    </div>
  );
};
export default RadioButtons
