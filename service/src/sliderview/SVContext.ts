import {T_Connector, T_ReqParam} from "../types";

export default class SVContext {
  data: {
    connectors: T_Connector[]
  }

  connector: { add, update, remove, test }//from API

  editNow

  panelDom: HTMLDivElement

  searchText: string

  _blurFnAry = []

  regBlurFn(fn) {
    this._blurFnAry.push(fn)
  }

  blur() {
    this._blurFnAry.forEach(fn => fn())
    this._blurFnAry = []
  }

  search(kw: string) {

  }

  editConnector(def) {
    this.editNow = def
  }

  removeConnector(id) {
    this.data.connectors = this.data.connectors.filter(con => con.id !== id)

    this.connector.remove(id)
  }

  editClose() {
    this.editNow = void 0
  }

  saveConnector(conData: T_Connector) {
    if (!this.editNow.id) {//add
      this.data.connectors.push(conData)
      const {id, title, url, method, script, paramAry, returnSchema} = conData
      this.connector.add({
        id,
        title,
        url,
        method,
        script,
        inputSchema: aryToSchema(paramAry),
        outputSchema: returnSchema.fact
      })
    } else {//update
      const exitDef = this.data.connectors.find(con => con.id === conData.id)
      Object.assign(exitDef, conData)

      const {id, title, url, method, script, paramAry, returnSchema} = conData
      this.connector.update({
        id,
        title,
        url,
        method,
        script,
        inputSchema: aryToSchema(paramAry),
        outputSchema: returnSchema.fact
      })
    }
  }
}

function aryToSchema(ary: T_ReqParam[]) {
  if (ary) {
    const properties = {}
    ary.map(param => {
      properties[param.name] = {
        type: param.type, default: param.defaultValue
      }
    })

    return {
      type: 'object',
      properties
    }
  }
}