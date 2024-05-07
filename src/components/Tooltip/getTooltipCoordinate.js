import {Dimensions} from 'react-native';

function convertDimensionToNumber(dimension, screenDimension) {
  if (typeof dimension === 'string' && dimension.includes('%')) {
    const decimal = Number(dimension.replace(/%/, '')) / 100;
    return decimal * screenDimension;
  }

  if (typeof dimension === 'number') {
    return dimension;
  }
  return Number(dimension);
}

const getArea = (a, b) => a * b;

const getPointDistance = (a, b) =>
  Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));

const getTooltipCoordinate = (
  x,
  y,
  width,
  height,
  ScreenWidth,
  ScreenHeight,
  receivedTooltipWidth,
  withPointer,
) => {
  const screenDims = Dimensions.get('screen');

  const tooltipWidth = convertDimensionToNumber(
    receivedTooltipWidth,
    screenDims.width,
  );

  const center = [x + width / 2, y + height / 2];
  const pOne = [center[0], 0];
  const pTwo = [ScreenWidth, center[1]];
  const pThree = [center[0], ScreenHeight];
  const pFour = [0, center[1]];

  const vOne = getPointDistance(center, pOne);
  const vTwo = getPointDistance(center, pTwo);
  const vThree = getPointDistance(center, pThree);
  const vFour = getPointDistance(center, pFour);

  const areas = [
    getArea(vOne, vFour),
    getArea(vOne, vTwo),
    getArea(vTwo, vThree),
    getArea(vThree, vFour),
  ].map((each, index) => ({area: each, id: index}));

  const sortedArea = areas.sort((a, b) => b.area - a.area);

  const dX = 0.001;
  const dY = height / 2;

  const directionCorrection = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const deslocateReferencePoint = [
    [-tooltipWidth, 0],
    [0, 0],
    [0, 0],
    [-tooltipWidth, 0],
  ];

  const qIndex = sortedArea[0].id;

  const getWithPointerOffsetY = () =>
    withPointer ? 10 * directionCorrection[qIndex][1] : 0;
  const getWithPointerOffsetX = () =>
    withPointer ? center[0] - 18 * directionCorrection[qIndex][0] : center[0];

  const newX =
    getWithPointerOffsetX() +
    (dX * directionCorrection[qIndex][0] + deslocateReferencePoint[qIndex][0]);

  return {
    x: constraintX(newX, qIndex, center[0], ScreenWidth, tooltipWidth),
    y:
      center[1] +
      (dY * directionCorrection[qIndex][1] +
        deslocateReferencePoint[qIndex][1]) +
      getWithPointerOffsetY(),
  };
};

const constraintX = (newX, qIndex, x, ScreenWidth, tooltipWidth) => {
  switch (qIndex) {
    case 0:
    case 3: {
      const maxWidth = newX > ScreenWidth ? ScreenWidth - 10 : newX;
      return newX < 1 ? 10 : maxWidth;
    }
    case 1:
    case 2: {
      const leftOverSpace = ScreenWidth - newX;
      return leftOverSpace >= tooltipWidth
        ? newX
        : newX - (tooltipWidth - leftOverSpace + 10);
    }
    default: {
      return 0;
    }
  }
};

export default getTooltipCoordinate;
