import React, { FC, CSSProperties, useState, useRef, FocusEventHandler, ReactNode, useCallback, useMemo } from 'react';
import Editor, { HandlerType } from "@mybricks/coder";
import FormItem from '../FormItem';
import Input, { TextArea } from '../Input';
import RadioButtons from '../RadioButtons';
import { fullScreen, fullScreenExit } from '../../icon';
import { Methods } from '../../constant';

import styles from './index.less';

interface CommonItemProps {
  defaultValue: string;
  onBlur?: FocusEventHandler<any>;
  onChange?(value: any): void;
  require?: boolean
  key?: string;
  name?: string;
  style?: CSSProperties;
  /** 校验出错信息 */
  validateError?: string;
  children?: ReactNode;
}

/**
 * 请求方法选项
 */
const methodOpts = [
  { title: 'GET', value: Methods.GET },
  { title: 'POST', value: Methods.POST },
  { title: 'PUT', value: Methods.PUT },
  { title: 'DELETE', value: Methods.DELETE },
];

/** ------------基本信息配置项---------- **/
/**
 * 接口名称
 */
export const NameInput: FC<CommonItemProps> = ({ defaultValue, onBlur, onChange, require = false, }) => {
  return (
    <FormItem label='名称' require={require} >
      <Input
        key='interfaceName'
        defaultValue={defaultValue}
        onBlur={onBlur}
        onChange={onChange}
        placeholder='服务接口的标题'
      />
    </FormItem>
  )
}

/**
 * 
 * 接口地址
 */
export const AddressInput: FC<CommonItemProps> = ({ defaultValue, onBlur, onChange, require = true, validateError }) => {
  return (
    <FormItem label='地址' require={require} >
      <TextArea
        defaultValue={defaultValue}
        onBlur={onBlur}
        key='address'
        onChange={e => onChange(e)}
        validateError={validateError}
        placeholder='服务接口的地址'
      />
    </FormItem>
  )
}

/**
 * 请求方法
 */
export const MethodRadio: FC<CommonItemProps> = ({ defaultValue, onChange, require = true }) => {
  return (
    <FormItem label='请求方法' require={require} >
      <RadioButtons
        options={methodOpts}
        defaultValue={defaultValue}
        onChange={(value) => {
          onChange?.(value)
        }}
      />
    </FormItem>
  )
}


/** ------------开始请求/返回响应 配置项---------- **/

/** 编辑器共有配置 */
export const baseEditorConfig = {
  env: {
    isNode: false,
    isElectronRenderer: false,
  },
  width: '100%',
  height: '100%',
  minHeight: 300,
  language: 'javascript',
  theme: 'light',
  lineNumbers: 'on',
  /** @ts-ignore */
  scrollbar: {
    horizontalScrollbarSize: 2,
    verticalScrollbarSize: 2,
  },
  minimap: { enabled: false }
}

/** 带全屏编辑能力的编辑器 */
export const EditorWithFullScreen = ({ CDN, value, unique, onChange, path }) => {
  const [open, setOpen] = useState<boolean>(false);

  const editorRef = useRef<HandlerType>(null);


  const onOpen = useCallback(async () => {
    setOpen(true);
  }, []);

  const onClose = useCallback(async () => {
    setOpen(false);
  }, []);
  
  return (
    <>
      {
        !open ? <div
        onClick={onOpen}
        className={styles.sidebarPanelCodeIcon}
      >
        {fullScreen}
      </div> : null
      }
      <Editor
        width="100%"
        ref={editorRef}
        key={unique}
        height={500}
        eslint={{
          src: CDN?.eslint,
        }}
        path={path}
        modal={
          {
            open,
            width: "90%",
            title: "编辑代码",
            height: '90%',
            inside: true,
            onOpen,
            onClose,
          }
        }
        babel={{ standalone: CDN?.babel }}
        loaderConfig={{ paths: CDN?.paths }}
        language="javascript"
        theme="light"
        value={value}
        onChange={onChange}
      />
    </>
  )
}

/** ------------其他信息配置项---------- **/
/**
 * 接口描述
 */
export const DescriptionInput: FC<CommonItemProps> = ({ defaultValue, onBlur, require = false, validateError }) => {
  return (
    <FormItem label='接口描述' require={require}>
      <Input
        defaultValue={defaultValue}
        onBlur={(e) => {
          onBlur(e)
        }}
        key='desc'
        validateError={validateError}
        placeholder='接口描述'
      />
    </FormItem>
  )
}


/**
 * 接口文档
 */
export const DocInput: FC<CommonItemProps> = ({ defaultValue, onBlur, onChange, require = false, validateError }) => {
  return (
    <FormItem label='文档链接' require={require}>
      <TextArea
        style={{ height: 80 }}
        onBlur={(e) => {
          onBlur(e)
        }}
        onChange={onChange}
        key='doc'
        validateError={validateError}
        defaultValue={defaultValue}
      />
    </FormItem>
  )
}
