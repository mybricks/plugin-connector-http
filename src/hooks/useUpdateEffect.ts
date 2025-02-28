import { useRef, useEffect } from "react";

const useUpdateEffect = (effect: React.EffectCallback, deps: React.DependencyList, config: { skipCount: number }) => {
  const ref = useRef(config.skipCount);

  useEffect(() => {
    if (!ref.current) {
      effect();
    } else {
      ref.current--;
    }
  }, deps);
}

export default useUpdateEffect;
