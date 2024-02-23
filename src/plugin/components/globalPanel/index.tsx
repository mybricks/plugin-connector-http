import React from 'react';
import Editor from '@mybricks/code-editor';
import Collapse from '../../../components/Collapse';
import { CDN, templateErrorResultFunc } from '../../../constant';
import { debounce } from '../../../utils/lodash';
import PanelWrap from '../../../components/panel';

export default function GlobalPanel({ onClose, style, data }: any) {
	return (
		<PanelWrap style={style} title="全局配置" onClose={onClose}>
			<Collapse header="当开始请求">
				<Editor
					width="100%"
					height={400}
					language="javascript"
					theme="light"
					lineNumbers="on"
					CDN={CDN}
					scrollbar={{ horizontalScrollbarSize: 2, verticalScrollbarSize: 2 }}
					value={decodeURIComponent(data.config.paramsFn)}
					onChange={debounce((code: string) => {
						if (data.config.paramsFn !== code) {
							data.config.paramsFn = code;
						}
					}, 100)}
					env={{ isNode: false, isElectronRenderer: false }}
					minimap={{ enabled: false }}
				/>
			</Collapse>
			<Collapse header="当返回响应">
				<Editor
					width="100%"
					height={400}
					language="javascript"
					theme="light"
					lineNumbers="on"
					CDN={CDN}
					scrollbar={{ horizontalScrollbarSize: 2, verticalScrollbarSize: 2 }}
					value={decodeURIComponent(data.config.resultFn)}
					onChange={debounce((code: string) => {
						if (data.config.resultFn !== code) {
							data.config.resultFn = code;
						}
					}, 100)}
					env={{ isNode: false, isElectronRenderer: false }}
					minimap={{ enabled: false }}
				/>
			</Collapse>
			<Collapse header="当接口响应错误时">
				<Editor
					width="100%"
					height={400}
					language="javascript"
					theme="light"
					lineNumbers="on"
					CDN={CDN}
					scrollbar={{ horizontalScrollbarSize: 2, verticalScrollbarSize: 2 }}
					value={decodeURIComponent(data.config.errorResultFn || templateErrorResultFunc)}
					onChange={debounce((code: string) => {
						if (data.config.errorResultFn !== code) {
							data.config.errorResultFn = code;
						}
					}, 100)}
					env={{ isNode: false, isElectronRenderer: false }}
					minimap={{ enabled: false }}
				/>
			</Collapse>
		</PanelWrap>
	);
}
