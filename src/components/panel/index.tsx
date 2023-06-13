import React, {FC, useEffect} from 'react';
import {render, unmountComponentAtNode} from "react-dom";

let container = null;
const PanelWrap: FC = props => {
	if (!container) {
		container = document.createElement('div');
		container.setAttribute('data-id', 'plugin-panel-root');
		document.body.appendChild(container);
	}
	
	useEffect(() => {
		render(<>{props.children}</>, container);
		
		return () => {
			unmountComponentAtNode(container);
		}
	}, []);
	
  return null;
};

export default PanelWrap;
