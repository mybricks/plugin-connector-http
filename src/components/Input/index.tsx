import React from 'react';
import css from './index.less';

export default function Input({
  defaultValue,
  onChange,
  validateError = '',
  placeholder,
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
          <input defaultValue={defaultValue} placeholder={placeholder} onChange={onChange} />
        ) : (
          <textarea
            defaultValue={defaultValue}
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
