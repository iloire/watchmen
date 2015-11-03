exports = module.exports = (function(){

  return {

    /**
     * Round number
     * @param number
     * @param decimals
     * @returns {number}
     */

    round: function (number, decimals) {
      if (typeof decimals === 'undefined') {
        decimals = 2;
      }
      return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },

    /**
     * Get random integer on the range specified
     * @param min
     * @param max
     * @returns {Number} random integer
     */

    getRandomInt: function (min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
  };

})();