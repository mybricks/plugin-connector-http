import React from 'react';
import css from './index.less';

export default function Input({
  title,
  value,
  onChange,
  validateError = '',
  placeholder,
  require = false,
  type = 'input',
}: any) {
  return (
    <div className={css.input}>
      <div
        className={`${css.editor} ${css.textEdt} ${
          validateError ? css.error : ''
        }`}
        data-err={validateError}
      >
        {type === 'input' ? (
          <input value={value} placeholder={placeholder} onChange={onChange} />
        ) : (
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}

export function TextArea(...props: any) {
  return Input({ ...props, type: 'textarea' });
}
