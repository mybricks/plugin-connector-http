import css from './index.less';
import React, { useEffect, useState } from 'react';

export default function RadioButtons({ options, defaultValue, onChange  }) {
  const [select, setSelect] = useState(defaultValue);
  
  useEffect(() => {
    setSelect(defaultValue);
  }, [defaultValue]);

  return (
    <div className={css.edt}>
      {options.map((opt) => {
        return (
          <div
            key={opt.value}
            className={`${css.opt} ${opt.value === select ? css.selected : ''}`}
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
}
