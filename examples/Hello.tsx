import * as React from 'react';

export function hello(props: { initial?: number }) {
  const [count, setCount] = React.useState<number>(props.initial ?? 0);
  const doubled = (() => { return count * 2; })();
  const memoTripled = React.useMemo(() => { return count * 3; }, [count]);
  React.useEffect(() => { console.log('mounted'); }, []);
  function increment() { setCount(count + 1); }
  function add(delta: number) { setCount(count + delta); }
  return ( <div style={{ padding: 12 }}>
      <h1>Hello crowe‑lang</h1>
      <p>count: {count}</p>
      <p>doubled (IIFE): {doubled}</p>
      <p>tripled (memo): {memoTripled}</p>
      <button onClick={() => increment()}>+1</button>
      <button onClick={() => add(5)}>+5</button>
    </div> );
}

