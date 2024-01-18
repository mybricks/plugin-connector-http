import React, { useCallback, useState } from "react";
import axios from "axios";
import css from "./index.less";
import { Select, Input, Button } from "antd";
const { TextArea } = Input;

window._AI_HISTORY_LIST_ = []

export default function ({ command, userId }) {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(null);
  const [timeCost, setTimeCost] = useState(0);
  const [mode, setMode] = useState("simple");
  const [historyList, setHistoryList] = useState(window._AI_HISTORY_LIST_)

  const generate = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setSuccess(false);
    setError(false);
    axios
      .post("https://ai.mybricks.world/api/chat/generator", {
        requirement: requirement,
        mode: mode,
        userId: userId,
      })
      .then(async ({ data }) => {
        if (data.code === 1) {
          const schema = data.data.schema;
          const comArray = schema.map((item) => ({
            type: item.namespace,
            data: item.data,
            slots: item.slots
              ? {
                  content: item.slots.map((slotsItem) => ({
                    type: slotsItem.namespace,
                    data: slotsItem.data,
                  })),
                }
              : undefined,
          }));

          const component = { data: comArray };
          console.log("AI res: ", component);
          const execRes = await command.exec("ui.addComs", component);
          console.log("exec res: ", execRes);
          setSuccess(true);
          setRequirement("");
          setTimeCost(data.data.cost.time);
          const newList = [...historyList, requirement]
          window._AI_HISTORY_LIST_ = newList
          setHistoryList(newList)
        } else {
          throw "";
        }
      })
      .catch((err) => {
        console.log(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loading, requirement, isMultiMode]);

  return (
    <div className={css.container}>
      <div
        style={{
          fontSize: 12,
          color: "#777",
          marginTop: "10px",
          userSelect: "text",
          maxHeight: '40%',
          overflow: 'scroll',
        }}
        >
        <h2 style={{fontSize: 16}}>示例：</h2>
        <p>添加一个按钮，标题是添加活动</p>
        <p>添加一个危险按钮，风格是次按钮，小尺寸，标题是添加活动</p>
        <p>添加一个圆角虚线按钮，大尺寸，标题是删除</p>
        <p>
          添加一用于记录学生成绩的表格，需要包含学生姓名和各科成绩，学生姓名列需要左固定
        </p>
        <p>下拉菜单，触发方式为点击</p>
        <p>
          添加一个下拉菜单，弹出位置是右下方，提示内容设置为请选择，宽度设置为120px，并关闭子选项
        </p>
        <p>添加一个多选框组件，选项有足球、篮球、羽毛球、排球</p>
        <p>
          添加一个文本框，最大支持输入四个字，显示尾部的清除图标，提示内容为请输入名称，显示字数统计
        </p>
        <p>添加一个用于选择体育项目的下拉框</p>
      </div>
      <div style={{
        fontSize: 12,
        color: "#777",
        marginTop: 10,
        width: '100%',
        maxHeight: '40%',
        overflow: 'scroll',
        userSelect: "text",
      }}>
        <h2 style={{width: '100%', fontSize: 16}}>历史记录：</h2>
        {historyList?.map((i, index) => {
          return <p>{index + 1}、{i}</p>
        })}
      </div>
      <div style={{
        width: '96%',
        position: 'absolute',
        bottom: 10,
        left: '2%'
      }}>
        <div className={`${css.input} ${isTextAreaFocused ? css.focused : ""}`}>
          <TextArea
            className={css.textarea}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            onFocus={() => {
              setIsTextAreaFocused(true);
            }}
            style={{ boxShadow: "none", border: 'none' }}
            // onEnter={generate}
            onPressEnter={() => {
              // console.log('111')
              generate()
            }}
            onBlur={() => setIsTextAreaFocused(false)}
          />
          <div className={css.magicInputFooter}>
            <Select
              className={css.modeSelect}
              style={{ width: 95,marginLeft:'-5px' }}
              value={mode}
              size="small"
              onChange={(e) => {
                setMode(e.target.value);
              }}
              options={[
                { value: "simple", label: "简单模式" },
                { value: "expert", label: "专家模式(内测中)", disabled: true },
              ]}
            />
            <div className={css.magicInputFooterLimit}>
              {requirement.length}/1000
            </div>
            <button
              type="button"
              className={`${css.magicInputSend} ${
                requirement.length ? "" : css.isEmpty
              }`}
              onClick={generate}
            >
              {/* <span className={css.magicInputSend}></span> */}
            </button>
          </div>
        </div>
        <div className={css.statusBar}>
          {error && <div className={css.error}>出错啦，再试一次吧</div>}
          {success && <div className={css.success}>执行成功</div>}
          {loading && <div style={{width: '80%'}}>
            <img src='https://static.dingtalk.com/media/lAHPDetfeJOZ1pBgYA_96_96.gif' style={{width: 16, marginRight: 4}} alt="" />
            AI生成中...
          </div>}
          {
            success ? (<div className={css.time}>
              <span>耗时 {(timeCost / 1000).toFixed(2)} s</span>
            </div>) : null
          }
        </div>
      </div>
    </div>
  );
}
