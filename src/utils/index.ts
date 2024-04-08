import { isEmpty, cloneDeep } from '../utils/lodash';
import { SERVICE_TYPE } from '../constant';

export function formatSchema(schema: any) {
  if (!schema) return;
  if (schema.type === 'object') {
    Object.values(schema.properties).forEach((item) => {
      formatSchema(item);
    });
  } else if (schema.type === 'array') {
    if (isEmpty(schema.items)) {
      Object.defineProperty(schema, 'type', {
        writable: true,
        value: 'array',
      });
      Reflect.deleteProperty(schema, 'items');
    } else {
      if (schema.items.type === 'object') {
        Object.values(schema.items.properties).forEach((item) => {
          formatSchema(item);
        });
      }
      // TODO oneOf
    }
  } else if (schema.type === 'unknown') {
    Object.defineProperty(schema, 'type', {
      writable: true,
      value: 'string',
    });
  }
}

function setData(data, keys, val) {
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
}

export function getDataByOutputKeys(data, outputKeys) {
  let outputData: any = Array.isArray(data) ? [] : {};
  if (outputKeys === void 0 || outputKeys.length === 0) {
    outputData = data;
  } else {
    outputKeys.forEach((key: string) => {
      setData(data, key.split('.'), outputData);
    });
  }
  return outputData;
}

function del(data, keys) {
  const len = keys.length;
  function dfs(data, index) {
    if (!data || index === len) return;
    const key = keys[index];
    if (index === len - 1) {
      Reflect.deleteProperty(data, key);
    }
    if (Array.isArray(data)) {
      data.forEach(item => { dfs(item, index)})
    } else {
	    dfs(data[key], index + 1);
    }
  }
  dfs(data, 0)
}

export function getDataByExcludeKeys(data, excludeKeys) {
  if (!excludeKeys || excludeKeys.length === 0) {
    return data;
  }
  const res = cloneDeep(data);
  excludeKeys.forEach(keys => {
    del(res, keys.split('.'));
  })
  return res;
}

export function paramsToSchema(node) {
	let schema: any = { type: node.type };

	switch (node.type) {
		case 'root':
			schema.type = 'object';
			schema.properties = {};
			node.children.forEach((childNode) => {
				schema.properties[childNode.name] = paramsToSchema(childNode);
			});
			break;
		case 'object':
			schema.properties = {};
			node.children.forEach((childNode) => {
				schema.properties[childNode.name] = paramsToSchema(childNode);
			});
			break;
		case 'array':
			schema.type = 'array';
			schema.items = node.children[0] ? paramsToSchema(node.children[0]) : {};
			break;
	}

	return schema;
}

export function params2data(params: any) {
  if (!params) return {};
  let obj: any = {};

  if (params.type === 'string') {
    return params.defaultValue || '';
  }
  if (params.type === 'any') {
    return params.defaultValue || '';
  }
  if (params.type === 'number') {
    return +params.defaultValue;
  }
  if(params.type === 'boolean') {
    return Boolean(params.defaultValue)
  }

  if (params.children) {
    if (params.type === 'array') {
      obj = [];
    }
    params.children.forEach((child: any) => {
      obj[child.name] = params2data(child);
    });
  }

  return obj;
}

export function hasFile(params: any) {
  if (!params) return false;
  let obj = false;

  if (params.type === 'any') {
    return params.defaultValue instanceof File;
  }

  if (params.children) {
    params.children.forEach((child: any) => {
      obj = obj || hasFile(child);
    });
  }

  return obj;
}

export function uuid(len = 6) {
  const seed = 'abcdefhijkmnprstwxyz';
  const maxPos = seed.length;
  let rtn = '';
  for (let i = 0; i < len; i++) {
    rtn += seed.charAt(Math.floor(Math.random() * maxPos));
  }
  return 'u_' + rtn;
}

export function schema2data(schema: any) {
  function getBasicData(schema: any) {
    const { type } = schema;

    if (schema.default !== void 0 && schema.default !== '') {
      return schema.default;
    }

    if (type === 'string') {
      const { minLength = 0, maxLength = 8 } = schema;
      const min = +minLength;
      const max = +maxLength;
      const str = uuid(max).slice(
        max - Math.round(min + Math.random() * (max - min))
      );
      return str;
    } else {
      const { minimum = 0, maximum = 100 } = schema;
      const min = +minimum;
      const max = +maximum;
      return min + Math.round(Math.random() * (max - min));
    }
  }
  function uuid(len = 6) {
    const seed = 'abcdefhijkmnprstwxyz';
    const maxPos = seed.length;
    let rtn = '';
    for (let i = 0; i < len; i++) {
      rtn += seed.charAt(Math.floor(Math.random() * maxPos));
    }
    return rtn;
  }
  function mockSchemaData(schema: any) {
    if (!schema) return;
    let obj: any;
    const { type } = schema;
    if (type === 'string' || type === 'number') {
      return getBasicData(schema);
    }

    if (type === 'array') {
      obj = [];
      const { minItems = 1, maxItems = 5 } = schema;
      const len = minItems + Math.round(Math.random() * (maxItems - minItems));
      for (let i = 0; i < len; i++) {
        const value = schema2data(schema.items);
        if (value !== null && value !== void 0) {
          obj.push(value);
        }
      }
    }
    if (schema.type === 'object') {
      obj = {};
      Object.keys(schema.properties || {}).forEach((key) => {
        obj[key] = schema2data(schema.properties[key]);
      });
    }
    return obj;
  }
  return mockSchemaData(schema);
}

export function jsonToSchema(json: any): any {
  const schema = { type: void 0 };
  proItem({ schema, val: json });
  if (schema.type) {
    return schema;
  } else {
    return;
  }
}

function proItem({ schema, val, key, fromAry }: { schema: any; val: any; key?: string; fromAry?: any[] }) {
  if (Array.isArray(val)) {
    const items = val.length ? {} : void 0 ;
    if (key) {
      schema[key] = {
        type: 'array',
        items
      };
      if (items) {
        schema[key].items = items;
      }
    } else {
      schema.type = 'array';
      if (items) {
        schema.items = items;
      }
    }

    proAry(items, val);
  } else {
    if (typeof val === 'object' && val) {
      let nSchema;
      if (fromAry) {
        schema.type = 'object';
        nSchema = schema.properties = {};
      }

      const properties = fromAry ? nSchema : {};

      if (!fromAry) {
        if (key) {
          schema[key] = {
            type: 'object',
            properties
          };
        } else {
          schema.type = 'object';
          schema.properties = properties;
        }
      }

      proObj(properties, val);
    } else {
      const type = val === null || val === void 0 ? 'unknown' : typeof val;
      if (key === void 0) {
        schema.type = type;
      } else {
        schema[key] = { type }
      }
    }
  }
}

function proObj(curSchema: any, obj: any) {
  Object.keys(obj).map((key) => {
    return proItem({ schema: curSchema, val: obj[key], key });
  });
}

function proAry(curSchema, ary) {
  if (!curSchema) return;
	
	const schemaList = [];
  if (ary.length > 0) {
	  ary.forEach(item => {
			const schema = JSON.parse(JSON.stringify(curSchema));
		  proItem({ schema, val: item, fromAry: true } as unknown as any);
		  schemaList.push(schema);
	  })
  }
	mergeSchemaTypeBySchemaList(curSchema, schemaList.filter(Boolean));
}

const mergeSchemaTypeBySchemaList = (schema, schemaList) => {
	if (!schemaList) {
		return schema;
	}
	
	let curSchema = null;
	for (let index	= 0; index < schemaList.length; index++) {
		const item = schemaList[index];
		
		if (!item || !Object.keys(item).length) {
			continue;
		}
		
		if (!curSchema) {
			if (item.type !== 'unknown') {
				if (item.type === 'object' || item.type === 'array') {
					curSchema = item;
					Object.assign(schema, item);
				} else {
					delete schema.properties;
					Object.assign(schema, item);
					break;
				}
			} else {
				delete schema.properties;
				Object.assign(schema, item);
			}
		} else {
			if (schema.type === 'object' && item.type === 'object') {
				Object.keys(item.properties || {}).forEach((key) => {
					const property = schema.properties[key];
					
					if ((!property && item.properties[key]) || (property.type === 'unknown' && item.properties[key].type !== 'unknown')) {
						schema.properties[key] = item.properties[key];
					}
				});
			} else if (schema.type === 'array' && item.type === 'array') {
				if (!schema.items || !Object.keys(schema.items).length) {
					schema.items = item.items || {};
				}
			}
		}
	}
	
	if (schema.type === 'object') {
		Object.keys(schema.properties || {}).forEach((key) => {
			if (schema.properties?.[key]?.type === 'object') {
				mergeSchemaTypeBySchemaList(schema.properties[key], schemaList.filter(Boolean).map(item => item?.properties?.[key]));
			} else if (schema.properties?.[key]?.type === 'array') {
				if (!schema.properties?.[key]?.items) {
					schema.properties[key].items = {};
				}
				
				mergeSchemaTypeBySchemaList(schema.properties[key], schemaList.filter(Boolean).map(item => item?.properties?.[key]));
			}
		});
	} else if (schema.type === 'array') {
		if (!schema.items) {
			schema.items = {};
		}
		
		mergeSchemaTypeBySchemaList(schema.items, schemaList.filter(Boolean).map(item => item?.items || {}));
	}
}

export function safeDecode(code: string) {
  try {
    return decodeURIComponent(code);
  } catch (error) {
    return code;
  }
}

export const extractParamsBySchema = (originSchema) => {
	const params = { id: uuid(), name: 'root', type: 'root', children: [] };

	const dfs = (param, schema) => {
		if (schema.type === 'object') {
			Object.keys(schema.properties).forEach(key => {
				const property = schema.properties[key];
				const item = { type: property.type, name: key, id: uuid(), defaultValue: property.defaultValue ?? '', children: []  };
				param.children.push(item);

				if (['array', 'object'].includes(property.type)) {
					dfs(item, property);
				}
			});
		} else if (schema.type === 'array') {
			if (!schema.items?.type) {
				return;
			}
			const item = { type: schema.items.type, name: '0', id: uuid(), defaultValue: schema.items.defaultValue ?? '', children: []  };
			param.children.push(item);

			if (['array', 'object'].includes(schema.items.type)) {
				dfs(item, schema.items);
			}
		}
	};

	dfs(params, originSchema);

	return params;
};

export const extractParamsAndSchemaByJSON = (json) => {
	const params = { id: uuid(), name: 'root', type: 'root', children: [] };
	const originSchema = jsonToSchema(json);
	formatSchema(originSchema);

	const dfs = (param, json) => {
		if (!json) {
			return;
		}

		if (Array.isArray(json)) {
			json.forEach((value, index) => {
				const type = value === null || value === void 0 ? 'string' : (Array.isArray(value) ? 'array' : typeof value);
				const item = { name: String(index), id: uuid(), defaultValue: ['object', 'array'].includes(type) ? '' : value, children: [], type };

				param.children.push(item);

				dfs(item, value);
			});
		} else if (typeof json === 'object') {
			Object.keys(json).forEach(key => {
				const type = json[key] === null || json[key] === void 0 ? 'string' : (Array.isArray(json[key]) ? 'array' : typeof json[key]);
				const item = { name: key, id: uuid(), defaultValue: ['object', 'array'].includes(type) ? '' : json[key], children: [], type };
				param.children.push(item);

				dfs(item, json[key]);
			});
		}
	};

	dfs(params, json);

	return { params, originSchema };
};

/** 查询连接器选项的父元素以及对应索引 */
export const findConnector = (connectors: any[], curConnector: any) => {
	let parent = null, index = -1;
	const dfs = (connectors: any[]) => {
		if (parent) {
			return;
		}
		const curIndex = connectors.findIndex(con => con.id === curConnector.id);
		if (curIndex !== -1) {
			parent = connectors;
			index = curIndex;
		} else {
			connectors.filter(con => con.type === SERVICE_TYPE.FOLDER).forEach(con => dfs(con.children));
		}
	};

	dfs(connectors);

	return { parent, index };
};

/** 获取连接器树里所有连接器 */
export const getConnectorsByTree = (connectors: any[]) => {
	let list = [];
	const dfs = (connectors: any[]) => {
		connectors.forEach(con => {
			if (con.type === SERVICE_TYPE.FOLDER) {
				dfs(con.children);
			} else {
				list.push(con);
			}
		});
	};

	dfs(connectors);

	return list;
};

/** 替换连接器里所有自连接器的id和创建时间 */
export const replaceConnectorIdsAndTime = (connectors: any[] | any) => {
	const dfs = (connectors: any[] | any) => {
    if(Array.isArray(connectors)) {
      connectors.forEach(con => {
        if (con.type === SERVICE_TYPE.FOLDER) {
          dfs(con.children);
          con.id = uuid()
        } else {
          con.id = uuid()
          con.createTime = Date.now()
          con.updateTime = Date.now()
        }
      });
    } else {
      connectors.id = uuid()
      if(connectors.createTime || connectors.updateTime) {
        connectors.createTime = Date.now();
        connectors.updateTime = Date.now();
      }
      if(connectors.type === SERVICE_TYPE.FOLDER) {
        dfs(connectors.children)
      }
    }
	};

	dfs(connectors);
  
	return connectors;
};

export const filterConnectorsByKeyword = (connectors: any[], keyword: string) => {
	if (!connectors?.length) {
		return [];
	}
	if (!keyword) {
		return connectors;
	}

	const dfs = (connector) => {
		if (connector.content.title.includes(keyword)) {
			return connector;
		}

		if (connector.type === SERVICE_TYPE.FOLDER) {
			let children = [];
			connector.children.forEach(con => {
				const item = dfs(con);

				if (item) {
					children.push(item);
				}
			});

			return children.length ? { ...connector, children } : undefined;
		}
	};

	return connectors.map(dfs).filter(Boolean);
};