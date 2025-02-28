import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC, ReactNode } from 'react';

import styles from './index.less';

export type ButtonProps = Omit<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'type'> & {
  type?: string;
  size?: string;
  children?: ReactNode;
  dotTip?: boolean;
}

const Button: FC<ButtonProps> = props => {
  const { children, ...otherProps } = props;

  return (
    <button className={styles.btn} {...(otherProps as Record<string, string>)}>
      {otherProps.dotTip && <div className={styles.dotTip}>＊</div>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
