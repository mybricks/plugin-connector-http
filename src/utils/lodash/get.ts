export default function get(data: any, originKeys: any, defaultValue?: any) {
  if (!originKeys || !data) return data;
  const keys = Array.isArray(originKeys) ? [...originKeys] : originKeys.split('.');
  let res = data;
  for (let i = 0; i < keys.length; i++) {
    res = res[keys[i]];
    if (res === void 0 || res === null) return defaultValue;
  }
  return res;
}
