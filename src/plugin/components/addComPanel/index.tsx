import React, { useState, useRef } from "react";
import { Button } from "../../../components"

import css from "./index.less";

type AddComPanelProps = {
  visible: boolean;
  globalContext: any;
  sidebarContext: any;
}

const AddComPanel = (props: AddComPanelProps) => {
  const { visible, globalContext, sidebarContext } = props;
  const context = useRef({
    pageX: 0,
    pageY: 0,
    connector: null
  });
  const [showPopup, setShowPupup] = useState(false);
  const [coms, setComs] = useState([]);

  const onDrop = (e) => {
    const connector = sidebarContext.connector.getById(globalContext.dragItem.id);
    const schema = connector.markList[0].outputSchema;
    const matchedComponentsBySchema = sidebarContext.component.getComDefAryBySchema(schema);
    context.current.pageX = e.pageX;
    context.current.pageY = e.pageY;
    context.current.connector = connector;
    setComs(matchedComponentsBySchema);
    setShowPupup(true);
  }

  const onClose = () => {
    setShowPupup(false);
    setComs([]);
  }

  const onClick = (com) => {
    const { pageX, pageY, connector } = context.current;

    sidebarContext.component.addInstance({
			connector,
			namespace: com.namespace
		}, {
      left: pageX,
      top: pageY
    })
    
    onClose();
  }

  const onMaskClick = () => {
    onClose();
  }

  return (
    <>
      <div
        className={css.comDropContainer}
        style={{
          display: visible ? "block" : "none"
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={onDrop}
      >

      </div>
      {showPopup && (
        <div className={css.mask} onClick={onMaskClick}>
          <div
            className={css.popup}
            style={{
              left: context.current.pageX,
              top: context.current.pageY,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={css.title}>
              <div>添加组件</div>
              <div>
                <Button size="small" onClick={onClose}>
                  关 闭
                </Button>
              </div>
            </div>
            <div className={css.comsList}>
              {coms.length ? coms.map((com) => {
                return (
                  <div className={css.comItem} data-mybricks-tip={com.title} onClick={() => onClick(com)}>
                    <div className={css.comIcon}>
                      <img className={css.comImg} src={com.icon} />
                    </div>
                    <div className={css.comTitle}>
                      {com.title}
                    </div>
                  </div>
                )
              }) : "未匹配到对应schema的组件"}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddComPanel;

