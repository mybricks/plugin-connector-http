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
  const [generateCost, setGenerateCost] = useState(null)

  const handleRequirementChange = useCallback((e) => {
    setRequirement(e.target.value);
  }, []);

  const generate = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setSuccess(false);
    setError(false);
    axios
      .post("http://127.0.0.1:13000/api/ai/intent-conjecture2", {
        demand: requirement,
      })
      .then(async (res) => {
        if (res.data.code === 1) {
          console.log("---", res.data);
          const schema = res.data.data.result;
          const comArray = schema.map((item) => ({
            type: item.namespace,
            data: item.data,
            // slots: item.slots ? ({
            //   content: item.slots.map((slotsItem) => ({
            //     type: slotsItem.namespace,
            //     data: slotsItem.data,
            //   })),
            // }) : undefined,
          }));
          
          const component = { data: comArray[0] };
          console.log("AI res: ", component);
          const execRes = await command.exec("ui.addComs", component);
          console.log("exec res: ", execRes);

          setIntentCost(res.data.data.intentCost);
          let unitOperationTotalTokens = 0
           res.data.data.logs.forEach(item=> {
            unitOperationTotalTokens += item.cost.generate.usage.total_tokens
          })
          let unitOperationMaxTime = Math.max(res.data.data.logs.map(item=> item.cost.vec.time+item.cost.generate.time))
          setGenerateCost({
            unitOperationTotalTokens,
            unitOperationMaxTime
          })
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
        { intentCost &&
          <li>
          <span>任务拆解：</span>
          <div className={css.time}>{intentCost.time}</div>
          <div className={css.token}>{intentCost.usage.total_tokens}</div>
        </li>
        }
        <li>
          <span>向量检索+组件生成：</span>
          <div className={css.time}>3</div>
          <div className={css.token}>6</div>
        </li>
        <li>
          <span>总和：</span>
          <div className={css.time}>3</div>
          <div className={css.token}>6</div>
        </li>
      </ul>
    </div>
  );
}
