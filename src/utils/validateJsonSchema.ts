/** 简单类型 */
export const acceptedSimpleType = ['number', 'boolean', 'string', 'any' ,'follow' ]


export const checkValidJsonSchema = (json: Record<string, any>) => {
  const recurseJson = (json: Record<string, any>, path: string[]) => {
    if('type' in json) {
      if(json.type === 'object') {
        if(json.properties === undefined) {
          debugger
          return false
        }
        return recurseJson(json.properties, [...path, 'properties'])
      }
      if(json.type === 'array') {
        if(!('items' in json)) {
          debugger
          return false
        }
        else {
          return recurseJson(json.items, [...path, 'items'])
        }
      }
      if(acceptedSimpleType.includes(json.type)) {
        return true
      } else {
        debugger
        return false
      }
    }else {
      let lastPathProperty = path[path.length -1]
      if(lastPathProperty === 'properties') {
        const res = []
        for (let key in json) {
          res.push(recurseJson(json[key], [...path, key]))
        }
        // 确定，properties里面允许是{}
        if(res.length && res.some(i => i === false)){
          return false
        }
        return true
      }
      else {
        if(!json.type) {
          return false
        }
      }
    }
  }
  return recurseJson(json, [])
}


