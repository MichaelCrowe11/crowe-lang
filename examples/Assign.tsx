import * as React from 'react';

export function assign() {
  const [x, setX] = React.useState<any>(1);
  const [y, setY] = React.useState<any>(2);
  function bumpAll() { setX(x + 1);
    setY(x + y); }
  return ( <button onClick={() => bumpAll()}>bump</button> );
}

