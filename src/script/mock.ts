import { schema2data } from '../utils';

export function mock(connector: { id: string; script: string; [key: string]: any }) {
	return new Promise((resolve, reject) => {
		const schema = connector.outputSchema || connector.mockSchema;
		try {
			if (schema) {
				resolve({ __OUTPUT_ID__: connector.mockOutputId, __ORIGIN_RESPONSE__: schema2data(connector.outputSchema) });
			} else {
				reject('服务接口组件返回值类型不存在，不支持模拟数据')
			}
		} catch (ex) {
			reject('服务接口数据模拟失败');
		}
	});
}