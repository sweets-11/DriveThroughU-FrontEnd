import BackgroundService from 'react-native-background-actions';

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

// You can do anything in your task such as network requests, timers and so on,
// as long as it doesn't touch UI. Once your task completes (i.e. the promise is resolved),
// React Native will go into "paused" mode (unless there are other tasks running,
// or there is a foreground app).
/* const veryIntensiveTask = async taskDataArguments => {
  // Example of an infinite loop task
  const {delay} = taskDataArguments;
  await new Promise(async resolve => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      console.log('From background: ', i);
      await sleep(delay);
    }
  });
}; */

const options = {
  taskName: 'Fething location in background',
  taskTitle: 'Location fetch',
  taskDesc:
    'DriveThroughU is fetching location in background to update your location',
  taskIcon: {
    name: 'ic_notification',
    type: 'drawable',
  },
  linkingURI: 'zipcart://home', // See Deep Linking for more info
  parameters: {
    delay: 1000,
  },
};

export const startBgTask = async veryIntensiveTask => {
  if (BackgroundService.isRunning() || !veryIntensiveTask) return;
  await BackgroundService.start(veryIntensiveTask, options);
  /* await BackgroundService.updateNotification({
    taskDesc: 'New ExampleTask description',
  }); */ // Only Android, iOS will ignore this call
  // iOS will also run everything here in the background until .stop() is called
  BackgroundService.on('expiration', () => {
    console.log('I am being closed :(');
  });
};

export const stopBgTask = async intervalId => {
  if (intervalId) clearInterval(intervalId);
  await BackgroundService.stop();
};
