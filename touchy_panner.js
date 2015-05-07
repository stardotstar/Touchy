
/*
touchy_panner.js, version 1.0

pan events for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/Touchy.js.
Licenced under the Apache license (see LICENSE file)
 */

(function() {
  (function(window) {
    var TouchyPannerDefinition, extend, noop;
    extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    noop = function() {};
    TouchyPannerDefinition = function($, EventEmitter, TweenMax) {
      var TouchyPanner;
      TouchyPanner = (function() {
        var _default_options;

        function TouchyPanner(elm, options) {
          this.elm = $(elm).first();
          this.options = $.extend({}, _default_options, options);
          this._configurePanner();
          this._setupTouchyInstance();
          this._configureOptions();
          this._configureNav();
          this.value(this.options.initial_index);
          this._setupResize();
          this.emitEvent('init', [this]);
          this.elm.css('opacity', 1);
        }

        _default_options = {
          vertical: false,
          initial_index: 0,
          container_elm: '.options',
          option_elm: '.option',
          nav_elm: '.nav',
          threshold: 20,
          velocityXThreshold: 1,
          deltaXThresholdPercent: .3
        };

        TouchyPanner.prototype.refreshOptions = function() {
          var _ref;
          if ((_ref = this._tl) != null) {
            _ref.kill();
          }
          this._configureOptions();
          return this.value(this.options.initial_index);
        };

        TouchyPanner.prototype._setupTouchyInstance = function() {
          this._touchy = new Touchy(this.elm);
          this._touchy.on('start', (function(_this) {
            return function(event, t, pointer) {
              return _this._onStart(event, pointer);
            };
          })(this));
          this._touchy.on('move', (function(_this) {
            return function(event, t, pointer) {
              return _this._onMove(event, pointer);
            };
          })(this));
          this._touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              return _this._onEnd(event, pointer);
            };
          })(this));
          return this._touchy.on('cancel', (function(_this) {
            return function(event, t, pointer) {
              return _this._onEnd(event, pointer);
            };
          })(this));
        };

        TouchyPanner.prototype._configurePanner = function() {
          this.elm.addClass('panner');
          this.elm.addClass(this.options.vertical ? 'panner_v' : 'panner_h');
          this._options_elm = this.elm.find(this.options.container_elm);
          return this._options_elm.css({
            position: 'relative'
          });
        };

        TouchyPanner.prototype._configureOptions = function() {
          var option, _i, _len, _ref, _results;
          this._tl = new TimelineMax({
            paused: true
          });
          this._options = this._options_elm.find('.option');
          this._options.css({
            position: 'absolute'
          });
          this._option_count = this._options.length;
          this._option_w = this._options_elm.width();
          _ref = this._options;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            option = _ref[_i];
            _results.push(this._addOptionPage(option));
          }
          return _results;
        };

        TouchyPanner.prototype._addOptionPage = function(option) {
          var id, offset;
          id = $(option).data('id');
          offset = {
            left: 0
          };
          this._tl.from(option, .4, {
            x: this._option_w - offset.left,
            ease: Linear.easeNone
          });
          this._tl.fromTo(option, .1, {
            opacity: 0
          }, {
            opacity: 1,
            ease: Power1.easeInOut
          }, "-=.25");
          this._tl.add("option-" + id);
          this._tl.to(option, .4, {
            x: -(this._option_w - offset.left),
            ease: Linear.easeNone
          });
          return this._tl.to(option, .1, {
            opacity: 0,
            ease: Power1.easeInOut
          }, "-=.25");
        };

        TouchyPanner.prototype._configureNav = function() {
          var next_touchy, prev_touchy;
          this._nav_elm = this.elm.find(this.options.nav_elm);
          prev_touchy = new Touchy(this._nav_elm.find('.prev'));
          prev_touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              event.preventDefault();
              return _this._panTo(_this._current_option - 1);
            };
          })(this));
          next_touchy = new Touchy(this._nav_elm.find('.next'));
          return next_touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              event.preventDefault();
              return _this._panTo(_this._current_option + 1);
            };
          })(this));
        };

        TouchyPanner.prototype.value = function(val) {
          if (val != null) {
            return this._pageTo(val, true);
          } else {
            return this._current_option;
          }
        };

        TouchyPanner.prototype._pageTo = function(id, instant) {
          var data_id;
          this._current_option = id;
          data_id = this._options.eq(this._current_option).data('id');
          if (instant) {
            this._tl.seek("option-" + data_id);
          } else {
            this._tl.seek("option-" + data_id);
          }
          return this._updateNavState();
        };

        TouchyPanner.prototype._onStart = function(e, pointer) {};

        TouchyPanner.prototype._onMove = function(e, pointer) {
          var current_time, data_id, direction, distance, duration, duration_ms, duration_per_option, duration_per_pixel, time, time_change;
          direction = this._direction();
          distance = this._distance();
          if (direction && !direction.match(/^(left|right)$/)) {
            return true;
          }
          if (distance >= this.options.threshold && !this._started) {
            this._started = true;
            return this.emitEvent('panstart', [this]);
          } else if (this._started) {
            duration = this._tl.totalDuration();
            duration_ms = duration * 1000;
            duration_per_option = duration_ms / this._option_count;
            duration_per_pixel = duration_ms / (this._option_w * this._option_count);
            data_id = this._options.eq(this._current_option).data('id');
            current_time = this._tl.getLabelTime("option-" + data_id);
            time_change = Math.abs(distance * (duration_per_pixel / 2)) / 1000;
            if (direction === "right") {
              if (current_time - time_change < 0) {
                time_change = current_time;
              }
              time = "option-" + data_id + "-=" + time_change;
            } else if (direction === "left") {
              if (current_time + time_change > duration) {
                time_change = current_time;
              }
              time = "option-" + data_id + "+=" + time_change;
            }
            this._tl.seek(time);
            return this.emitEvent('panmove', [e, this]);
          }
        };

        TouchyPanner.prototype._onEnd = function(e, pointer) {
          var current_elm, direction, distance, next_ind;
          if (!this._started) {
            return;
          }
          direction = this._direction();
          distance = this._distance();
          current_elm = this._options.eq(this._current_option);
          current_elm.removeClass('current');
          if (direction === "left") {
            next_ind = this._current_option + 1;
          } else if (direction === "right") {
            next_ind = this._current_option - 1;
          }
          this._panTo(next_ind);
          this._started = false;
          return this.emitEvent('panend', [e, this]);
        };

        TouchyPanner.prototype._direction = function() {
          if (this._touchy.distance.x > 0) {
            return 'right';
          } else if (this._touchy.distance.x < 0) {
            return 'left';
          } else {
            return '';
          }
        };

        TouchyPanner.prototype._distance = function() {
          return Math.abs(this._touchy.distance.x);
        };

        TouchyPanner.prototype._panTo = function(id) {
          var data_id, elm;
          if (!(id > -1 && id < this._option_count)) {
            id = this._current_option;
          }
          elm = this._options.eq(id);
          elm.addClass('current');
          data_id = elm.data('id');
          this._tl.tweenTo("option-" + data_id, {
            ease: Strong.easeOut,
            onComplete: (function(_this) {
              return function() {
                return _this.emitEvent('panchanged', [_this]);
              };
            })(this)
          });
          this._current_option = id;
          return this._updateNavState();
        };

        TouchyPanner.prototype._updateNavState = function() {
          if (this._current_option === 0) {
            this.elm.addClass('first');
            return this.elm.removeClass('last');
          } else if (this._current_option === this._option_count - 1) {
            this.elm.addClass('last');
            return this.elm.removeClass('first');
          } else {
            return this.elm.removeClass('first last');
          }
        };

        TouchyPanner.prototype._valueToPercent = function(val) {
          return ((val - this.options.min_value) / (this.options.max_value - this.options.min_value)) * 100;
        };

        TouchyPanner.prototype._percentToValue = function(pct) {
          return ((pct / 100) * (this.options.max_value - this.options.min_value)) + this.options.min_value;
        };

        TouchyPanner.prototype._trimAlignValue = function(val) {
          var alignValue, step, valModStep;
          if (val <= this.options.min_value) {
            return this.options.min_value;
          }
          if (val >= this.options.max_value) {
            return this.options.max_value;
          }
          step = this.options.step > 0 ? this.options.step : 1;
          valModStep = (val - this.options.min_value) % step;
          alignValue = val - valModStep;
          if (Math.abs(valModStep) * 2 >= step) {
            alignValue += valModStep > 0 ? step : -step;
          }
          return parseFloat(alignValue.toFixed(5));
        };

        TouchyPanner.prototype._setupResize = function() {
          $(window).on('resize', (function(_this) {
            return function() {
              return _this._resize();
            };
          })(this));
          return this._resize();
        };

        TouchyPanner.prototype._resize = function() {
          if (this.options.vertical) {
            this._length = this.elm.height();
            this._offset = this.elm.offset().top;
          } else {
            this._length = this.elm.width();
            this._offset = this.elm.offset().left;
          }
          return this._setOptionHeight();
        };

        TouchyPanner.prototype._setOptionHeight = function() {
          var oh, option, _i, _len, _ref;
          if (this.elm.is(':visible')) {
            this._option_h = 0;
            _ref = this._options;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              option = _ref[_i];
              oh = $(option).outerHeight();
              if (oh > this._option_h) {
                this._option_h = oh;
              }
            }
            return this._options_elm.css({
              minHeight: this._option_h
            });
          }
        };

        extend(TouchyPanner.prototype, EventEmitter.prototype);

        return TouchyPanner;

      })();
      return TouchyPanner;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['jquery/jquery', 'eventEmitter/EventEmitter', 'gsap/gsap', 'jquery-transform/jquery-transform'], TouchyPannerDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchyPannerDefinition(require('jquery'), require('wolfy87-eventemitter'), require('gsap'), require('jquery-transform'));
    } else {
      return window.TouchyPanner = TouchyPannerDefinition(window.jQuery, window.EventEmitter, window.TweenMax);
    }
  })(window);

}).call(this);
