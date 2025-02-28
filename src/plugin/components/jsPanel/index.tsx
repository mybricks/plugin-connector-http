import React, { CSSProperties, FC, useCallback, useMemo, useRef } from 'react';
import PanelWrap from '../../../components/panel';
import FormItem from '../../../components/FormItem';
import Input from '../../../components/Input';
import { Collapse, EditorWithFullScreen, notice } from '../../../components';
import { CDN } from '../../../constant';
import { safeDecode, jsonToSchema } from '../../../utils';
import Button from '../../../components/Button';
import { debounce } from '../../../utils/lodash';
import { getDecodeString } from "../../../script";

const testOutputRun = functionString => eval(`(() => { return ${functionString ? getDecodeString(functionString) : '_ => _;' }})()`);

/** 默认返回数据值 */
export const exampleOutputFunc = `export default async function (params, { output }) {
  
}
`;

const defaultContent = {
  title: "",
  output: encodeURIComponent(exampleOutputFunc),
}

interface JsPanelProps {
	onClose(): void;
	style: CSSProperties;
	onSubmit(content: JsPanelProps['js']): void;
  js: {
    id: string;
    type: "js";
    content: {
      title: string;
      output: string;
      markList: {
        id: string;
        excludeKeys: string[];
        outputKeys: string[];
        outputSchema: object;
        predicate: {};
        resultSchema: object;
        title: string;
      }[];
    }
  }
}

const JsPanel: FC<JsPanelProps> = ({ onClose, style, onSubmit, js }) => {
  const contentRef = useRef({ ...defaultContent, ...js.content });

  const onSaveClick = async () => {
    if (!contentRef.current.title.length) {
      notice("请输入名称")
    } else {
      try {
        // const outputData = await testOutputRun(contentRef.current.output)({}, { output: () => {} });
        // console.log('outputData => ', outputData)
        // const outputSchema = jsonToSchema(outputData);
        // console.log("outputSchema => ", outputSchema)
        const outputSchema = {type: 'unknown'}; // [TODO]: 自定义
        const markList = [{
          id: "default",
          excludeKeys: [],
          outputKeys: [],
          outputSchema,
          predicate: {},
          resultSchema: outputSchema,
          title: "默认"
        }]
        onSubmit({...js, content: { ...contentRef.current, markList }});
      } catch (e) {
        console.error("【返回数据】逻辑错误，请检查 => ", e);
        notice(`【返回数据】逻辑错误，请检查 => ${e.message}`)
      }
    }
  }

  const onTitleChange = (e) => {
    contentRef.current.title = e.target.value.trim();
  }

  const onOutputChange = useCallback(debounce((code: string) => {
    contentRef.current.output = encodeURIComponent(code)
  }, 200), [])

  const editorPath = useMemo(() => {
    return `file:///${Math.random()}_code`;
  }, []);

	return (
		<PanelWrap
      style={style}
      title={contentRef.current.title}
      onClose={onClose}
      extra={<Button type="primary" size="small" onClick={onSaveClick}>保 存</Button>}
    >
			<Collapse header="基本信息" defaultFold={false}>
				<FormItem label='名称' require>
					<Input
						key='title'
						defaultValue={contentRef.current.title}
            onChange={onTitleChange}
						placeholder='请输入名称'
					/>
				</FormItem>
			</Collapse>
      <Collapse header="返回数据" defaultFold={false}>
				<EditorWithFullScreen
					unique={'output'}
					CDN={CDN}
					path={editorPath + 'output.js'}
          onChange={onOutputChange}
					value={safeDecode(contentRef.current.output)}
				/>
			</Collapse>
		</PanelWrap>
	);
};
export default JsPanel
