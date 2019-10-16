module.exports = function isNumber(n) {
  return typeof n === 'number' && !Number.isNaN(n);
};
