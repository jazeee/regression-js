"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('./utils'),
    round = _require.round,
    deriveDataProperties = _require.deriveDataProperties;

var DEFAULT_OPTIONS = {
  order: 2,
  precision: 2,
  period: null
};
/**
* Determine the solution of a system of linear equations A * x = b using
* Gaussian elimination.
*
* @param {Array<Array<number>>} input - A 2-d matrix of data in row-major form [ A | b ]
* @param {number} order - How many degrees to solve for
*
* @return {Array<number>} - Vector of normalized solution coefficients matrix (x)
*/

function gaussianElimination(input, order) {
  var matrix = input;
  var n = input.length - 1;
  var coefficients = [order];

  for (var i = 0; i < n; i++) {
    var maxrow = i;

    for (var j = i + 1; j < n; j++) {
      if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][maxrow])) {
        maxrow = j;
      }
    }

    for (var k = i; k < n + 1; k++) {
      var tmp = matrix[k][i];
      matrix[k][i] = matrix[k][maxrow];
      matrix[k][maxrow] = tmp;
    }

    for (var _j = i + 1; _j < n; _j++) {
      for (var _k = n; _k >= i; _k--) {
        matrix[_k][_j] -= matrix[_k][i] * matrix[i][_j] / matrix[i][i];
      }
    }
  }

  for (var _j2 = n - 1; _j2 >= 0; _j2--) {
    var total = 0;

    for (var _k2 = _j2 + 1; _k2 < n; _k2++) {
      total += matrix[_k2][_j2] * coefficients[_k2];
    }

    coefficients[_j2] = (matrix[n][_j2] - total) / matrix[_j2][_j2];
  }

  return coefficients;
}
/**
* The set of all fitting methods
*
* @namespace
*/


var methods = {
  linear: function linear(data, options) {
    var sum = [0, 0, 0, 0, 0];
    var len = 0;

    for (var n = 0; n < data.length; n++) {
      if (data[n][1] !== null) {
        len++;
        sum[0] += data[n][0];
        sum[1] += data[n][1];
        sum[2] += data[n][0] * data[n][0];
        sum[3] += data[n][0] * data[n][1];
        sum[4] += data[n][1] * data[n][1];
      }
    }

    var run = len * sum[2] - sum[0] * sum[0];
    var rise = len * sum[3] - sum[0] * sum[1];
    var gradient = run === 0 ? 0 : round(rise / run, options.precision);
    var intercept = round(sum[1] / len - gradient * sum[0] / len, options.precision);

    var predict = function predict(x) {
      return [round(x, options.precision), round(gradient * x + intercept, options.precision)];
    };

    return _objectSpread({
      predict: predict,
      equation: [gradient, intercept],
      string: intercept === 0 ? "y = ".concat(gradient, "x") : "y = ".concat(gradient, "x + ").concat(intercept)
    }, deriveDataProperties(data, predict, options));
  },
  exponential: function exponential(data, options) {
    var sum = [0, 0, 0, 0, 0, 0];

    for (var n = 0; n < data.length; n++) {
      if (data[n][1] !== null) {
        sum[0] += data[n][0];
        sum[1] += data[n][1];
        sum[2] += data[n][0] * data[n][0] * data[n][1];
        sum[3] += data[n][1] * Math.log(data[n][1]);
        sum[4] += data[n][0] * data[n][1] * Math.log(data[n][1]);
        sum[5] += data[n][0] * data[n][1];
      }
    }

    var denominator = sum[1] * sum[2] - sum[5] * sum[5];
    var a = Math.exp((sum[2] * sum[3] - sum[5] * sum[4]) / denominator);
    var b = (sum[1] * sum[4] - sum[5] * sum[3]) / denominator;
    var coeffA = round(a, options.precision);
    var coeffB = round(b, options.precision);

    var predict = function predict(x) {
      return [round(x, options.precision), round(coeffA * Math.exp(coeffB * x), options.precision)];
    };

    return _objectSpread({
      predict: predict,
      equation: [coeffA, coeffB],
      string: "y = ".concat(coeffA, "e^(").concat(coeffB, "x)")
    }, deriveDataProperties(data, predict, options));
  },
  logarithmic: function logarithmic(data, options) {
    var sum = [0, 0, 0, 0];
    var len = data.length;

    for (var n = 0; n < len; n++) {
      if (data[n][1] !== null) {
        sum[0] += Math.log(data[n][0]);
        sum[1] += data[n][1] * Math.log(data[n][0]);
        sum[2] += data[n][1];
        sum[3] += Math.pow(Math.log(data[n][0]), 2);
      }
    }

    var a = (len * sum[1] - sum[2] * sum[0]) / (len * sum[3] - sum[0] * sum[0]);
    var coeffB = round(a, options.precision);
    var coeffA = round((sum[2] - coeffB * sum[0]) / len, options.precision);

    var predict = function predict(x) {
      return [round(x, options.precision), round(round(coeffA + coeffB * Math.log(x), options.precision), options.precision)];
    };

    return _objectSpread({
      predict: predict,
      equation: [coeffA, coeffB],
      string: "y = ".concat(coeffA, " + ").concat(coeffB, " ln(x)")
    }, deriveDataProperties(data, predict, options));
  },
  power: function power(data, options) {
    var sum = [0, 0, 0, 0, 0];
    var len = data.length;

    for (var n = 0; n < len; n++) {
      if (data[n][1] !== null) {
        sum[0] += Math.log(data[n][0]);
        sum[1] += Math.log(data[n][1]) * Math.log(data[n][0]);
        sum[2] += Math.log(data[n][1]);
        sum[3] += Math.pow(Math.log(data[n][0]), 2);
      }
    }

    var b = (len * sum[1] - sum[0] * sum[2]) / (len * sum[3] - Math.pow(sum[0], 2));
    var a = (sum[2] - b * sum[0]) / len;
    var coeffA = round(Math.exp(a), options.precision);
    var coeffB = round(b, options.precision);

    var predict = function predict(x) {
      return [round(x, options.precision), round(round(coeffA * Math.pow(x, coeffB), options.precision), options.precision)];
    };

    return _objectSpread({
      predict: predict,
      equation: [coeffA, coeffB],
      string: "y = ".concat(coeffA, "x^").concat(coeffB)
    }, deriveDataProperties(data, predict, options));
  },
  polynomial: function polynomial(data, options) {
    var lhs = [];
    var rhs = [];
    var a = 0;
    var b = 0;
    var len = data.length;
    var k = options.order + 1;

    for (var i = 0; i < k; i++) {
      for (var l = 0; l < len; l++) {
        if (data[l][1] !== null) {
          a += Math.pow(data[l][0], i) * data[l][1];
        }
      }

      lhs.push(a);
      a = 0;
      var c = [];

      for (var j = 0; j < k; j++) {
        for (var _l = 0; _l < len; _l++) {
          if (data[_l][1] !== null) {
            b += Math.pow(data[_l][0], i + j);
          }
        }

        c.push(b);
        b = 0;
      }

      rhs.push(c);
    }

    rhs.push(lhs);
    var coefficients = gaussianElimination(rhs, k).map(function (v) {
      return round(v, options.precision);
    });

    var predict = function predict(x) {
      return [round(x, options.precision), round(coefficients.reduce(function (sum, coeff, power) {
        return sum + coeff * Math.pow(x, power);
      }, 0), options.precision)];
    };

    var string = 'y = ';

    for (var _i = coefficients.length - 1; _i >= 0; _i--) {
      if (_i > 1) {
        string += "".concat(coefficients[_i], "x^").concat(_i, " + ");
      } else if (_i === 1) {
        string += "".concat(coefficients[_i], "x + ");
      } else {
        string += coefficients[_i];
      }
    }

    return _objectSpread({
      string: string,
      predict: predict,
      equation: _toConsumableArray(coefficients).reverse()
    }, deriveDataProperties(data, predict, options));
  }
};

function createWrapper() {
  var reduce = function reduce(accumulator, name) {
    return _objectSpread({
      _round: round
    }, accumulator, _defineProperty({}, name, function (data, supplied) {
      return methods[name](data, _objectSpread({}, DEFAULT_OPTIONS, {}, supplied));
    }));
  };

  return Object.keys(methods).reduce(reduce, {});
}

module.exports = createWrapper();