export type T_Schema = {
  name: string,
  type: string
}

export type T_SchemaObject = {
  name: string,
  type: 'object'
  properties
}

export type T_SchemaList = {
  type: 'list'
  items: T_Schema
} & T_Schema

export type T_ReturnSchema = {
  all: T_Schema,//all schema for response
  fact: T_Schema,//filtered schema by marks
  _markAsReturn?: string
}

export type T_ReqParam = { name, type, defaultValue }

export type T_Connector = {
  id,
  title,
  method,
  url,
  paramAry: T_ReqParam[],
  returnSchema: T_ReturnSchema
  script
}