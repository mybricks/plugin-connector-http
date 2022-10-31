import React, { useState, useCallback } from 'react';
import css from './index.less';

export default function Input({
  children,
  overlay
}: any) {
  const [visible, setVisible] = useState(false);
  const onClick = useCallback(() => {
    setVisible(true);
  }, [])

  const hideContent = useCallback(() => {
    setVisible(false);
  }, [])
  return (
    <div className={css.dropdown}>
      <div onClick={onClick}>{children}</div>
      <div className={css.content} onClick={hideContent}>
        {visible ? overlay : null}
      </div>
    </div>
  );
}