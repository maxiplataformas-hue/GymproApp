/// <reference lib="webworker" />

let timer: any = null;

addEventListener('message', ({ data }) => {
  if (data === 'start') {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      postMessage('tick');
    }, 1000);
  } else if (data === 'stop') {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
});
