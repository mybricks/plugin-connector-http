import React from "react";

import css from "./index.less";


const AddComPanel2 = ({ connector, coms, component, closePlugin }) => {
  return coms.length ? (
    <>
      {/* <div className={css.split}></div> */}
      <span className={css.tips}>（以下组件可拖动添加至画布）</span>
      <div className={css.comsList}>
        {coms.map((com) => {
          return (
            <div
              className={css.comItem}
              data-mybricks-tip={com.title}
              onMouseDown={(e) => {
                component.dragToAddInstance(e, {
                  ...com,
                  connector
                })
                closePlugin();
              }}
            >
              <div className={css.comIcon}>
                <img className={css.comImg} src={com.icon} />
              </div>
              <div className={css.comTitle}>
                {com.title}
              </div>
            </div>
          )
        })}
      </div>
    </>
  ) : <span className={css.tips}>未匹配到对应schema的组件</span>;
}

export default AddComPanel2;
