import {T_Schema} from "../types";

export default function jsonToSchema(json): T_Schema {
  const schema = {type: void 0}
  proItem({schema, val: json})

  if (schema.type) {

    //console.log(schema)

    return schema
  } else {
    return
  }
}

function proItem({schema, val, key, fromAry}: { schema, val, key?, fromAry? }) {
  if (Array.isArray(val)) {
    const items = {}
    if (key) {
      schema[key] = {
        type: 'array',
        items
      }
    } else {
      schema.type = 'array'
      schema.items = items
    }

    proAry(items, val)
  } else {
//     if(key==='content'||key==='ZNMB_PC_DBTL'){
// debugger
//     }
    if (typeof val === 'object' && val) {
      let nSchema
      if(fromAry){
        schema.type = 'object'
        nSchema = schema.properties = {}
      }

      const properties = fromAry ? nSchema : {}

      if (!fromAry) {
        if (key) {
          schema[key] = {
            type: 'object',
            properties
          }
        } else {
          schema.type = 'object'
          schema.properties = properties
        }
      }

      proObj(properties, val)
    } else if (key) {
      schema[key] = {
        type: val === null ? 'unknown' : typeof val
      }
    }
  }
}

function proObj(curSchema, obj) {
  Object.keys(obj).map(key => {
    return proItem({schema: curSchema, val: obj[key], key})
  })
}

function proAry(curSchema, ary) {
  let sample
  if (ary.length > 0) {
    sample = ary[0]
  }

  proItem({schema: curSchema, val: sample, fromAry: true})
}