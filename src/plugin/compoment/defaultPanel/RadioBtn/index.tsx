import css from './index.less';

export default function RadioBtns({ options, binding }) {
  const [from, key] = binding;
  return (
    <div className={css.edt}>
      {options.map((opt) => {
        return (
          <div
            key={opt.value}
            className={`${css.opt} ${
              opt.value === from[key] ? css.selected : ''
            }`}
            onClick={(e) => {
              from[key] = opt.value;
            }}
          >
            {opt.title}
          </div>
        );
      })}
    </div>
  );
}
