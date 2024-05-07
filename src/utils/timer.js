const secondsToWaitBeforeRequestingAgain = 60;

const runTimer = ({timerRef, setTimer}) => {
  const timerId = setInterval(() => {
    timerRef.current -= 1;
    if (timerRef.current === 0) {
      clearInterval(timerId);
      setTimer(secondsToWaitBeforeRequestingAgain);
      timerRef.current = secondsToWaitBeforeRequestingAgain;
    } else {
      setTimer(timerRef.current);
    }
  }, 1000);
  return () => {
    clearInterval(timerId);
  };
};

export {runTimer, secondsToWaitBeforeRequestingAgain};
