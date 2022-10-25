import {T_Connector} from "../../types";
import {uuid} from "@mybricks/rxui";

export default class Ctx {
  data: T_Connector

  titleErr

  urlErr

  returnErr

  getScript(filter?: boolean) {
    return `
      function(params,{then,onError},{ajax}){
          ajax({url:'${this.data.url}',method:'${this.data.method}',params:params})
          .then(function(response) {
            var xpathForReturn = '${(filter === void 0 || filter) ? (this.data.returnSchema?._markAsReturn || '') : ''}'
            if(xpathForReturn!==''){
              if(response&&typeof response==='object'){
                try{
                  var xpathAry = xpathForReturn.split('/'),tobj = response
                  for(var ti=0;ti<xpathAry.length;ti++){
                    if(xpathAry[ti]!==''){
                      tobj = tobj[xpathAry[ti]]
                    }
                  }
                  then(tobj)
                }catch(ex){
                  onError(new Error('根据标记处理返回的数据错误:'+ex.message));
                }
              }else{
                onError(new Error('返回的数据类型不匹配'));
              }
            }else{
              then(response)
            }
          }).catch(function(err){
            onError(err);
          })
      }
    `
  }

  constructor() {
    this.data = {
      id: uuid('s_', 3),
      method: 'GET',
      paramAry: [],
      returnSchema: {}
    } as any
  }

  assetUrl() {
    this.urlErr = void 0
    if (!this.data.url || !this.data.url.match(/^https?:\/\//gi)) {
      this.urlErr = `地址为空或格式错误`
      return false
    }

    return true
  }

  validate() {
    this.reset()

    if (!this.data.title || this.data.title === '') {
      this.titleErr = `标题为空`
    }

    this.assetUrl()

    const factSchema = this.data.returnSchema.fact
    if (!factSchema) {
      this.returnErr = `返回内容为空`
    } else {
      const str = JSON.stringify(factSchema)
      if (str.indexOf(`"type":"unknown"`) >= 0) {
        this.returnErr = `存在未知的类型，请完成调整`
      }
    }

    return this.titleErr || this.urlErr || this.returnErr
  }

  reset() {
    this.titleErr = void 0
    this.urlErr = void 0
    this.titleErr = void 0
    this.returnErr = void 0
  }
}