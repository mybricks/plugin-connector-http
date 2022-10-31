import React from 'react';
import css from './index.less';

export default function Input({
  label: title,
  require,
  children
}: any) {
  return (
    <div className={css.item}>
      <label>
        {require ? <i>*</i> : null}
        {title}
      </label>
      <div className={css.content}>
        {children}
      </div>
    </div>
  );
}