export const convertToBool = string => {
  if (typeof string === 'string') {
    string = string.toLowerCase();
  }
  return string === 'true' || string === true || false;
};
