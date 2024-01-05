/** 简单类型 */
export const acceptedSimpleType = ['number', 'boolean', 'string', 'any' ,'follow' ]

export interface ErrorFieldData {
  path: string[]
  fieldName: string
  msg?: string
}
export const checkValidJsonSchema = (json: Record<string, any>) => {
  const recurseJson = (json: Record<string, any>, path: string[], errorFields: ErrorFieldData[]) => {
    if('type' in json) {
      if(json.type === 'object') {
        if(json.properties === undefined) {
          errorField.push({
            path: path,
            fieldName: 'properties',
            msg: 'type为object的描述缺少properties属性'
          })
          return false
        }
        return recurseJson(json.properties, [...path, 'properties'], errorFields)
      }
      if(json.type === 'array') {
        if(!('items' in json)) {
          errorField.push({
            path: path,
            fieldName: 'items',
            msg: 'type为array的描述缺少properties属性',
          })
          return false
        }
        else {
          return recurseJson(json.items, [...path, 'items'], errorFields)
        }
      }
      if(acceptedSimpleType.includes(json.type)) {
        return true
      } else {
        errorField.push({
          path: path,
          fieldName: 'type',
          msg: 'type类型不符合要求，需要为以下之一: number,boolean,string,any,follow,array,object'
        })
        return false
      }
    }else {
      let lastPathProperty = path[path.length -1]
      if(lastPathProperty === 'properties') {
        const res = []
        for (let key in json) {
          const temp = recurseJson(json[key], [...path, key], errorFields)
          res.push(temp)
          if(temp === false) {
            errorField.push({
              path: [...path, key],
              fieldName: key,
              msg: `properties中的${key}属性，缺少type类型`
            })
          }
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
  const errorField: ErrorFieldData[] = []
  const res = recurseJson(json, [], errorField)
  return [res, errorField]
}
