"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "BotPlayer", {
  enumerable: true,
  get: function () {
    return _BotPlayer.default;
  }
});
Object.defineProperty(exports, "GameAnalyzer", {
  enumerable: true,
  get: function () {
    return _GameAnalyzer.default;
  }
});
Object.defineProperty(exports, "MaterialCalculator", {
  enumerable: true,
  get: function () {
    return _MaterialCalculator.default;
  }
});
Object.defineProperty(exports, "MoveValidator", {
  enumerable: true,
  get: function () {
    return _MoveValidator.default;
  }
});
var _GameAnalyzer = _interopRequireDefault(require("./analysis/GameAnalyzer"));
var _BotPlayer = _interopRequireDefault(require("./bot/BotPlayer"));
var _MaterialCalculator = _interopRequireDefault(require("./utils/MaterialCalculator"));
var _MoveValidator = _interopRequireDefault(require("./utils/MoveValidator"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }