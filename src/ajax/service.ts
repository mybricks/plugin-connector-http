function callConnector(connector: any = {}, params: any, config: any) {
  return new Promise((resolve, reject) => {
    if (typeof connector.script === 'string') {
      try {
        const fn = eval(`(${decodeURIComponent(connector.script)})`);
        fn(
          params,
          { then: resolve, onError: reject },
          { ajax: config.ajax }
        );
      } catch (ex) {
        reject(`连接器script错误: ${ex}`);
      }
    } else {
      reject(`连接器错误`);
    }
  });
}

export { callConnector };
