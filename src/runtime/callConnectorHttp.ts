import axios from 'axios';
import { schema2data } from '../utils';
import { exampleParamsFunc } from '../constant';

interface IOptions {
  method: string;
  url: string;
  data: any;
  params: any;
  headers: any;
  [key: string]: any;
}

interface IConfig {
  before: (options: IOptions) => any;
}

const defaultFn = (options: IOptions, ...args: any) => ({
	...options,
	...args,
});

const httpRegExp = new RegExp('^(http|https)://');

const setData = (data, keys, val) => {
	const len = keys.length;
	function dfs(res, index, val) {
		if (!res || index === len) {
			return res;
		}
		const key = keys[index];
		if (Array.isArray(res)) {
			return res.map((item, i) => {
				const curVal = val[i];
				let obj;
				if (curVal === void 0) {
					obj = {};
					val.push(obj);
				} else {
					obj = curVal;
				}
				return dfs(item, index, obj);
			});
		} else {
			if (index === len - 1) {
				val[key] = res[key];
				return res[key];
			}
			res = res[key];
			if (Array.isArray(res)) {
				val[key] = val[key] || [];
			} else {
				val[key] = val[key] || {};
			}
		}
		return dfs(res, index + 1, Array.isArray(val) ? val : val[key]);
	}
	return dfs(data, 0, val);
};
const del = (data, keys) => {
	const len = keys.length;
	function dfs(data, index) {
		if (!data || index === len) return;
		const key = keys[index];
		if (index === len - 1) {
			Reflect.deleteProperty(data, key);
		}
		if (Array.isArray(data)) {
			data.forEach((item) => {
				dfs(item, index);
			});
		} else {
			dfs(data[key], index + 1);
		}
	}
	dfs(data, 0);
};
const getDecodeString = (fn: string) => fn
	? decodeURIComponent(fn).replace(
		/export\s+default.*function.*\(/,
		'function _RT_('
	)
	: fn;

const getFetch = (connector) => {
	return (params, { then, onError }, config) => {
		const method = connector.content.method;
		const path = connector.content.path.trim();
		const outputKeys = connector.content.outputKeys || [];
		const excludeKeys = connector.content.excludeKeys || [];
		const resultTransformDisabled = connector.content.resultTransformDisabled;

		try {
			const url = path;
			const newParams = eval(getDecodeString(connector.content.globalParamsFn || exampleParamsFunc))(
				method.startsWith('GET')
					? { params, url, method }
					: { data: params, url, method }
			);
			const hasGlobalResultFn = !!connector.content.globalResultFn;
			newParams.url = newParams.url || url;
			newParams.method = newParams.method || method;
			const options = eval(getDecodeString(connector.content.input || exampleParamsFunc))(newParams);
			options.url = (options.url || url).replace(/{(\w+)}/g, (match, key) => {
				const param = params[key] || '';
				Reflect.deleteProperty(options.params || {}, key);
				return param;
			});
			options.method = options.method || method;
			config
				.ajax(options)
				.then((response) => {
					if (hasGlobalResultFn) {
						return eval(getDecodeString(connector.content.globalResultFn))(
							{ response, config: options },
							{
								throwStatusCodeError: (data: any) => {
									onError(data);
								},
							}
						);
					}
					return response;
				})
				.then((response) => {
					return eval(getDecodeString(connector.content.output || exampleParamsFunc))(response, Object.assign({}, options), {
						throwStatusCodeError: (data) => {
							onError(data);
						},
					});
				})
				.then((response) => {
					if (resultTransformDisabled) {
						return then(response);
					}
					if (excludeKeys.length === 0) {
						return response;
					}
					excludeKeys.forEach((key) => {
						const keys = key.split('.');
						del(response, keys);
					});
					return response;
				})
				.then((response) => {
					let outputData: any = Array.isArray(response) ? [] : {};
					if (outputKeys === void 0 || outputKeys.length === 0) {
						outputData = response;
					} else {
						outputKeys.forEach((key) => {
							setData(response, key.split('.'), outputData);
						});

						/** 当标记单项时，自动返回单项对应的值 */
						if (Array.isArray(outputKeys) && outputKeys.length && (outputKeys.length > 1 || !(outputKeys.length === 1 && outputKeys[0] === ''))) {
							try {
								let cascadeOutputKeys = outputKeys.map(key => key.split('.'));
								while (Object.prototype.toString.call(outputData) === '[object Object]' && cascadeOutputKeys.every(keys => !!keys.length) && Object.values(outputData).length === 1) {
									outputData = Object.values(outputData)[0];
									cascadeOutputKeys.forEach(keys => keys.shift());
								}
							} catch(e) {
								console.log('connector format data error', e);
							}
						}
					}

					/** 领域模型接口按需展示日志，需返回源数据 */
					if (
						options.method.toUpperCase() === 'POST'
            && options.url.endsWith('/domain/run')
            && options.data
            && options.data.fileId
            && options.data.serviceId
            && options.data.params
            && options.data.params.showToplLog
					) {
						then({ __ORIGIN_RESPONSE__: response, outputData });
					} else {
						then(outputData);
					}
				})
				.catch((error) => {
					onError((error && error.message) || error);
				});
		} catch (error) {
			return onError(error);
		}
	};
};

export function call(
	connector: {
    id: string;
    script: string;
    useProxy?: boolean;
    [key: string]: any
  },
	params: any,
	config?: IConfig
) {
	return new Promise((resolve, reject) => {
		try {
			const fn = getFetch(connector);
			const { before = defaultFn } = config || {};
			fn(
				params,
				{ then: resolve, onError: reject },
				{
					ajax(options: IOptions) {
						const opts = before({ ...options });
						const { url } = opts;

						if (connector.useProxy && httpRegExp.test(url)) {
							return axios({ url: '/paas/api/proxy', method: 'post', data: opts || options }).then((res: any) => res.data).catch(error => {
								reject(error);
							});
						}

						return axios(opts || options).then((res: any) => res.data).catch(error => {
							reject(error);
						});
					},
				}
			);
		} catch (ex) {
			console.error('连接器script错误', ex);
			reject('连接器script错误.');
		}
	});
}

export function mock(
	connector: { id: string; script: string; [key: string]: any },
) {
	return new Promise((resolve, reject) => {
		if (connector.type === 'http' || connector.type === 'http-sql') {
			try {
				if (connector.outputSchema) {
					// use mock data
					return resolve(schema2data(connector.outputSchema));
				} else {
					reject('当前接口不存在返回值schema，不支持Mock');
				}
			} catch (ex) {
				reject('connecotr mock error.');
			}
		} else {
			reject('error connecotr type');
		}
	});
}