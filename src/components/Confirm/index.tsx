import React, { FC } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import Button from '../Button';
import styles from './index.less';

interface ConfirmProps {
  title: string;
  onOk: () => void;
  onCancel: () => void;
}

const ConfirmComponent: FC<ConfirmProps> = ({ title, onOk, onCancel }) => {
  return (
    <div className={styles.mask}>
      <div className={styles.confirm}>
        <div className={styles.title}>{title}</div>
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={onOk}>确定</Button>
        </div>
      </div>
    </div>
  );
};

export const confirm = (title: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    // Ensure the container is appended to body so it overlays everything
    document.body.appendChild(div);

    const cleanup = () => {
      try {
        unmountComponentAtNode(div);
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      } catch (e) {
        console.error('Confirm cleanup error', e);
      }
    };

    const onOk = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    render(
      <ConfirmComponent 
        title={title} 
        onOk={onOk} 
        onCancel={onCancel} 
      />, 
      div
    );
  });
};

export default confirm;
