import { get } from '../../../utils/lodash';

export function getNextP(row: any) {
  const { p, type, children = [] } = row;
  if (type === 'object' || type === 'array') {
    return `${p}.${children.length}`;
  }
}

export function resetP(row: any) {
  const { children = [] } = row;
  children.forEach((child: any, index: number) => {
    const arr = child.p.split('.');
    arr[arr.length - 1] = index;
    child.p = arr.join('.');
  });
}

export function getParentRow({ p }: any, dataSource: any) {
  const arr = p.split('.');
  return get(dataSource, arr.slice(0, -1).join('.children.'));
}

export function getParams(item: any, data: any) {
  if (!item) return data;
  const { name: originName, type, defaultValue, children } = item;
  const name = originName.replace(/\[/g, '').replace(/\]/g, '');
  if (children?.length) {
    if (type === 'object') {
      data[name] = {};
    } else if (type === 'array') {
      data[name] = [];
    }
    children.forEach((child: any) => {
      getParams(child, data[name]);
    });
  } else {
    data[name] = defaultValue;
  }
  return data;
}

export function getLast(list: any[]) {
  return list ? list[list.length - 1] : {};
}