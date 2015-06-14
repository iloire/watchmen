exports = module.exports = (function(){

  return {

    round: function (number, decimales) {
      if (typeof decimales === 'undefined') {
        decimales = 2;
      }
      return Math.round(number * Math.pow(10, decimales)) / Math.pow(10, decimales);
    },

    /**
     * Get random integer on the range specified
     * @param min
     * @param max
     * @returns {integer}
     */
    getRandomInt: function (min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
  }

})();