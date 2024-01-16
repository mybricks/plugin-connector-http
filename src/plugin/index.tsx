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
    axios
      .post("https://ai.mybricks.world/api/ai/intent-conjecture2", {
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
        }
        setSuccess(true);
        setRequirement("");
      })
      .catch((err) => {
        console.log(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loading, requirement]);

  return (
    <div className={css.container}>
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
      </ul>
      <div style={{ fontSize: 12, color: "#777",marginTop:'10px',userSelect:'text' }}>
        示例问题：
        <p>添加一个按钮 一个下拉框 一个文本框 一个日历</p>
        <p>添加一个按钮，风格是危险，形状是圆角矩形，小尺寸，标题是添加活动</p>
        <p>下拉菜单，触发方式为点击</p>
        <p>添加一个三列表格，分别是姓名、年龄、学号</p>
        <p>
          添加一个文本框，label是姓名，最大支持输入四个字，显示尾部的清除图标
        </p>
        <p>
          添加一个多选框组件，名称是兴趣爱好，选项有足球、篮球、羽毛球、排球，最大支持选三样
        </p>
        <p>添加一个下拉框，包含了全部、已删除、已生效、未生效四种选项</p>
      </div>
    </div>
  );
}
