/** 简单类型 */
export const acceptedSimpleType = ['number', 'boolean', 'string', 'any', 'follow']

export interface ErrorFieldData {
	path: string[]
	fieldName: string
	msg?: string
}

export const checkValidJsonSchema = (json: Record<string, any>) => {
	const recurseJson = (json: Record<string, any>, path: string[], errorFields: ErrorFieldData[]) => {
		let lastPathProperty = path?.length ? path[path.length-1] : ''
		// 避免遍历到properties里面的type属性
		if ('type' in json && lastPathProperty!== 'properties') {
			if (json.type === 'object') {
				if (json.properties === undefined) {
					errorField.push({
						path: path,
						fieldName: 'properties',
						msg: 'type 为 object 的描述缺少 properties 属性'
					});
					return false;
				}
				return recurseJson(json.properties, [...path, 'properties'], errorFields);
			}
			if (json.type === 'array') {
				if (!('items' in json)) {
					errorField.push({
						path: path,
						fieldName: 'items',
						msg: 'type 为 array 的描述缺少 properties 属性',
					});
					return false;
				} else {
					return recurseJson(json.items, [...path, 'items'], errorFields);
				}
			}
			if (acceptedSimpleType.includes(json.type)) {
				return true;
			} else {
				errorField.push({
					path: path,
					fieldName: 'type',
					msg: 'type 类型不符合要求，需要为以下之一: number, boolean, string, any, follow, array, object'
				});
				return false;
			}
		} else {
			let lastPathProperty = path[path.length - 1];
			if (lastPathProperty === 'properties') {
				const res = [];
				for (let key in json) {
					const temp = recurseJson(json[key], [...path, key], errorFields);
					res.push(temp);
					if (temp === false) {
						errorField.push({
							path: [...path, key],
							fieldName: key,
							msg: `properties 中的 ${key} 属性，缺少 type 类型`
						});
					}
				}
				// 确定，properties里面允许是{}
				return !(res.length && res.some(i => i === false));
			} else {
				if (!json.type) {
					return false;
				}
			}
		}
	}
	const errorField: ErrorFieldData[] = [];
	const res = recurseJson(json, [], errorField);

	return [res, errorField];
}

