import React, { FC, useState, useEffect } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import Button from '../Button';
import { TextArea } from '../Input';
import styles from './index.less';

interface PromptProps {
  title: string;
  defaultValue?: string;
  onOk: (value: string) => void;
  onCancel: () => void;
}

const PromptComponent: FC<PromptProps> = ({ title, defaultValue = '', onOk, onCancel }) => {
  const [value, setValue] = useState(defaultValue);
  // Auto focus logic could be added here if Input supports ref forwarding or autoFocus prop

  return (
    <div className={styles.mask}>
      <div className={styles.prompt}>
        <div className={styles.title}>{title}</div>
        <div className={styles.content}>
          <TextArea 
            defaultValue={defaultValue} 
            onChange={(e) => setValue(e.target.value)}
            style={{ width: '100%', height: '100px', resize: 'none' }}
            placeholder="请输入..."
          />
        </div>
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={() => onOk(value)}>确定</Button>
        </div>
      </div>
    </div>
  );
};

export const prompt = (title: string, defaultValue?: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const cleanup = () => {
      try {
        unmountComponentAtNode(div);
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      } catch (e) {
        console.error('Prompt cleanup error', e);
      }
    };

    const onOk = (value: string) => {
      cleanup();
      resolve(value);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    render(
      <PromptComponent 
        title={title} 
        defaultValue={defaultValue}
        onOk={onOk} 
        onCancel={onCancel} 
      />, 
      div
    );
  });
};

export default prompt;
