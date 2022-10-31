import React from 'react';
import css from './index.less';

export default function Button({ children, ...props }: any) {
  return (
    <button className={css.btn} {...props}>
      <span>{children}</span>
    </button>
  );
}
