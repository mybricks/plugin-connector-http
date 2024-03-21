import React from 'react';
import { CDN, templateErrorResultFunc } from '../../../constant';
import Editor from "@mybricks/coder";
import Collapse from '../../../components/Collapse';
import { debounce } from '../../../utils/lodash';
import PanelWrap from '../../../components/panel';

export default function GlobalPanel({ onClose, style, data }: any) {
	return (
		<PanelWrap style={style} title="全局配置" onClose={onClose}>
			<Collapse header="当开始请求">
				<Editor
					width="100%"
					height={400}
					eslint={{
						src: CDN?.eslint,
					}}
					path={`file:///_global_req_code.js`}
					babel={{ standalone: CDN?.babel }}
					loaderConfig={{ paths: CDN?.paths }}
					language="javascript"
					theme="light"
					value={decodeURIComponent(data.config.paramsFn)}
					onChange={debounce((code: string) => {
						if (data.config.paramsFn !== code) {
							data.config.paramsFn = code;
						}
					}, 100)}
				/>
			</Collapse>
			<Collapse header="当返回响应">
				<Editor
					width="100%"
					height={300}
					language="javascript"
					theme="light"
					eslint={{
						src: CDN?.eslint,
					}}
					path={`file:///_global_res_code.js`}
					babel={{ standalone: CDN?.babel }}
					loaderConfig={{ paths: CDN?.paths }}
					value={decodeURIComponent(data.config.resultFn)}
					onChange={debounce((code: string) => {
						if (data.config.resultFn !== code) {
							data.config.resultFn = code;
						}
					}, 100)}
				/>
			</Collapse>
			<Collapse header="当接口响应错误时">
				<Editor
					width="100%"
					height={400}
					language="javascript"
					theme="light"
					path={`file:///_global_error_code.js`}
					eslint={{
						src: CDN?.eslint,
					}}
					babel={{ standalone: CDN?.babel }}
					loaderConfig={{ paths: CDN?.paths }}
					value={decodeURIComponent(data.config.errorResultFn || templateErrorResultFunc)}
					onChange={debounce((code: string) => {
						if (data.config.errorResultFn !== code) {
							data.config.errorResultFn = code;
						}
					}, 100)}
				/>
			</Collapse>
		</PanelWrap>
	);
}
