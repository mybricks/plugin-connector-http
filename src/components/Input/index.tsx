import React, { useState, useEffect, useRef } from 'react';
import css from './index.less';

export default function Input({
  defaultValue,
  onChange,
  onBlur,
  validateError = '',
  placeholder,
  style= {},
  type = 'input',
}: any) {
  const domRef = useRef(null);
  const [innerValue, setInnerValue] = useState(defaultValue)
  useEffect(() => {
    if(validateError && !innerValue) {
      domRef.current?.classList.add(css.error);
    }
  }, [validateError])

  const innerChange = (e) => {
    if(validateError) {
      domRef.current?.classList.remove(css.error);
    }
    setInnerValue(e.target.value)
    onChange?.(e)
  }
  return (
    <div className={css.input}>
      <div
        ref={domRef}
        className={`${css.editor} ${css.textEdt}`}
        data-err={validateError}
      >
        {type === 'input' ? (
          <input
            defaultValue={defaultValue}
            value={innerValue}
            placeholder={placeholder}
            onBlur={onBlur}
            style={style}
            onChange={innerChange}
          />
        ) : (
          <textarea
            defaultValue={defaultValue}
            placeholder={placeholder}
            onChange={innerChange}
            onBlur={onBlur}
            style={style}
          />
        )}
      </div>
    </div>
  );
}

export function TextArea(props: any) {
  return Input({ ...props, type: 'textarea' });
}
