import React, { useCallback, useState } from "react";
import axios from "axios";
import { LoadingOutlined } from "@ant-design/icons";
import css from "./index.less";
// import Loading from './compoment/loading'
export default function ({ command }) {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [intentCost, setIntentCost] = useState(null);
  const [generateCost, setGenerateCost] = useState(null);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [simpleModeCost, setSimpleModeCost] = useState(null);

  const handleRequirementChange = useCallback((e) => {
    setRequirement(e.target.value);
  }, []);

  const generate = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setSuccess(false);
    setError(false);
    setIntentCost(null);
    setGenerateCost(null);
    setSimpleModeCost(null);
    if (isMultiMode) {
      axios
        .post("https://ai.mybricks.world/api/ai/intent-conjecture2", {
          // .post("https://ai.mybricks.world/api/ai/intent-conjecture2", {
          demand: requirement,
        })
        .then(async (res) => {
          if (res.data.code === 1) {
            console.log("---", res.data);
            const schema = res.data.data.result;
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

            setIntentCost(res.data.data.intentCost);
            let unitOperationTotalTokens = 0;
            res.data.data.logs.forEach((item) => {
              unitOperationTotalTokens += item.cost.generate.usage.total_tokens;
            });
            let unitOperationMaxTime = Math.max(
              ...res.data.data.logs.map(
                (item) => item.cost.vec.time + item.cost.generate.time
              )
            );
            setGenerateCost({
              unitOperationTotalTokens,
              unitOperationMaxTime,
            });
            setSuccess(true);
            setRequirement("");
          } else {
            setError(true);
          }
        })
        .catch((err) => {
          console.log(err);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      axios
        .post("https://ai.mybricks.world/api/ai/addUnitSchema", {
          // .post("https://ai.mybricks.world/api/ai/intent-conjecture2", {
          requirement,
        })
        .then(async (res) => {
          if (res.data.code === 1) {
            console.log("---", res.data);
            const schema = res.data.data.unitSchema;
            const component = {
              data: { type: schema.namespace, data: schema.data },
            };
            console.log("AI res: ", component);
            const execRes = await command.exec("ui.addComs", component);
            console.log("exec res: ", execRes);
            setSimpleModeCost(res.data.data.cost);
            setSuccess(true);
            setRequirement("");
          } else {
            setError(true);
          }
        })
        .catch((err) => {
          console.log(err);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [loading, requirement, isMultiMode]);

  return (
    <div className={css.container}>
      <div className={css.mode}>
        <label className={css.label}>多组件模式：</label>
        <label className={css.switch}>
          <input
            type="checkbox"
            checked={isMultiMode}
            onChange={(e) => {
              setIsMultiMode(e.target.checked);
            }}
          ></input>
          <span className={css.slider}></span>
        </label>
      </div>
      <textarea
        className={css.input}
        value={requirement}
        onChange={handleRequirementChange}
      />
      <div className={css.operation}>
        <button className={css.exec} onClick={generate}>
          {loading ? <LoadingOutlined /> : "执行"}{" "}
        </button>
        {error && <div className={css.error}>出错啦，再试一次吧</div>}
        {success && <div className={css.success}>执行成功</div>}
      </div>
      <ul className={css.cost}>
        {intentCost && (
          <li>
            <span>任务拆解：</span>
            <div className={css.time}>{intentCost.time / 1000}s</div>
            <div className={css.token}>
              {intentCost.usage.total_tokens} tokens
            </div>
          </li>
        )}
        {generateCost && (
          <li>
            <span>组件生成：</span>
            <div className={css.time}>
              {generateCost.unitOperationMaxTime / 1000}s
            </div>
            <div className={css.token}>
              {generateCost.unitOperationTotalTokens} tokens
            </div>
          </li>
        )}
        {generateCost && (
          <li>
            <span>总和：</span>
            <div className={css.time}>
              {(intentCost.time + generateCost.unitOperationMaxTime) / 1000}s
            </div>
            <div className={css.token}>
              {intentCost.usage.total_tokens +
                generateCost.unitOperationTotalTokens}{" "}
              tokens
            </div>
          </li>
        )}
        {simpleModeCost && (
          <>
            <li>
              <span>向量检索：</span>
              <div className={css.time}>{simpleModeCost.vec.time / 1000}s</div>
            </li>
            <li>
              <span>组件生成：</span>
              <div className={css.time}>
                {simpleModeCost.generate.time / 1000}s
              </div>
              <div className={css.token}>
                {simpleModeCost.generate.usage.total_tokens} tokens
              </div>
            </li>
            <li>
              <span>总和：</span>
              <div className={css.time}>
                {(simpleModeCost.vec.time + simpleModeCost.generate.time) /
                  1000} s
              </div>
              <div className={css.token}>
                {simpleModeCost.generate.usage.total_tokens} tokens
              </div>
            </li>
          </>
        )}
      </ul>
      <div
        style={{
          fontSize: 12,
          color: "#777",
          marginTop: "10px",
          userSelect: "text",
        }}
      >
        示例问题：
        <p>添加一个按钮，标题是添加活动</p>
        <p>添加一个按钮 一个文本框 一个日历</p>
        <p>添加一个危险按钮，风格是次按钮，小尺寸，标题是添加活动</p>
        <p>添加一个圆角虚线按钮，大尺寸，标题是删除</p>
        <p>添加一个三列表格，分别是姓名、年龄、学号</p>
        <p>下拉菜单，触发方式为点击</p>
        <p>
          添加一个下拉菜单，弹出位置是右下方，提示内容设置为请选择，宽度设置为120px，并关闭子选项
        </p>
        <p>
          添加一个多选框组件，选项有足球、篮球、羽毛球、排球
        </p>
        <p>
          添加一个文本框，最大支持输入四个字，显示尾部的清除图标，提示内容为请输入名称，显示字数统计
        </p>
        <p>添加一个下拉框，包含了全部、已删除、已生效、未生效四种选项</p>
        <p>添加一个学生信息搜索表单，包含姓名、学号的检索表单项</p>
      </div>
    </div>
  );
}
