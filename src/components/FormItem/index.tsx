import React, { CSSProperties, FC } from 'react';

import css from './index.less';

export interface FormItemProps {
  label?: string;
  require?: boolean;
  /** label 是否显示在顶部 */
  labelTop?: boolean;
  className?: string;
  contentStyle?: CSSProperties
}

const FormItem: FC<FormItemProps> = props => {
  const { label: title, require, contentStyle, className = '', children, labelTop = false } = props;

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
};

export default FormItem;
