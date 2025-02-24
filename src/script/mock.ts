import { schema2data } from '../utils';

export function mock(connector: { id: string; script: string; [key: string]: any }) {
	return new Promise((resolve, reject) => {
		try {
			const schema = connector.outputSchema || connector.mockSchema;
			if (schema) {
				resolve(connector.isMultipleOutputs === false ? schema2data(schema) : { __OUTPUT_ID__: connector.mockOutputId, __ORIGIN_RESPONSE__: schema2data(schema) });
			} else {
				reject('服务接口组件返回值类型不存在，不支持模拟数据')
			}
		} catch (ex) {
			reject('服务接口数据模拟失败');
		}
	});
}