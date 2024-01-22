const SLOTS_KEY_MAP = {
    "mybricks.normal-pc.card": "body",
  };

export function traverseSchemaRecursively(schema: []) {
  return schema.map((item) => {
    const slotKey = SLOTS_KEY_MAP?.[item.namespace] || "content";
    return {
      type: item.namespace,
      data: item.data,
      slots: item.slots || item.children
        ? {
            [slotKey]: traverseSchemaRecursively(item.slots || item.children),
          }
        : null,
    };
  });
}
