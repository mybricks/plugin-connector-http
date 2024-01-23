import React from 'react';
import css from './index.less';

export default function FormItem({
  label: title,
  require,
	contentStyle,
  className = '',
  children,
  labelTop = false
}: any) {
  return (
    <div className={`${css.item} ${labelTop ? css.labelTop : ''} ${className}`}>
      <label>
        {require ? <i>*</i> : null}
        {title}
      </label>
      <div className={css.content} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
