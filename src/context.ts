const globalData = {
	connectors: [],
};

const init = (connectors: Array<Record<string, unknown>>) => {
	globalData.connectors = [...connectors];
};

const add = (connector: Record<string, unknown>) => {
	globalData.connectors.push(connector);
};

const remove = (id: string) => {
	globalData.connectors = globalData.connectors.filter(con => con.id !== id);
};

const update = (connectorInfo: Record<string, unknown>) => {
	const connector = globalData.connectors.find(con => con.id === connectorInfo.id);

	if (connector) {
		Object.assign(connector, connectorInfo);
	}
};

export const getConnectors = () => {
	return globalData.connectors;
};

const GlobalContext = { init, add, remove, update, getConnectors };
export default GlobalContext;