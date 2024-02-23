import React, { useState, useEffect, useRef, CSSProperties, FC, FocusEventHandler } from 'react';

import styles from './index.less';

export interface InputProps {
  defaultValue?: string;
  onChange?(e: any): void;
  onBlur?: FocusEventHandler<HTMLTextAreaElement | HTMLInputElement>;
  validateError?: string;
  placeholder?: string;
  style?: CSSProperties;
  type?: 'input' | 'textarea';
}

const Input: FC<InputProps> = props => {
  const { defaultValue, onChange, onBlur, validateError = '', placeholder, style= {}, type = 'input' } = props;
  const domRef = useRef(null);
  const [innerValue, setInnerValue] = useState(defaultValue);
  useEffect(() => {
    if(validateError && !innerValue) {
      domRef.current?.classList.add(styles.error);
    }
  }, [validateError]);

  const innerChange = (e) => {
    if(validateError) {
      domRef.current?.classList.remove(styles.error);
    }
    setInnerValue(e.target.value);
    onChange?.(e);
  };

  return (
    <div className={styles.input}>
      <div
        ref={domRef}
        className={`${styles.editor} ${styles.textEdt}`}
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
};

export const TextArea: FC<Omit<InputProps, 'type'>> = props => Input({...props, type: 'textarea'});

export default Input;
