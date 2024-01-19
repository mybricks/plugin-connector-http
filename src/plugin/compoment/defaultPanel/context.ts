import {createContext} from 'react';


export interface ErrorField {
  name: string | string[]
}
export const DefaultPanelContext = createContext({
  addBlurAry: (key: string, blur: any) => {},
  errorFields: [] as Array<ErrorField>
});
