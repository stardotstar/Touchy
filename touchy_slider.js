
/*
touchy_slider.js, version 1.0

Slide control for Touchy.

(c) 2015 Copyright Stardotstar.
project located at https://github.com/stardotstar/TouchySlider.js.
Licenced under the Apache license (see LICENSE file)
 */

(function() {
  (function(window) {
    var TouchySliderDefinition, extend, noop;
    extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    noop = function() {};
    TouchySliderDefinition = function(Touchy, $, EventEmitter, TweenMax) {
      var TouchySlider;
      TouchySlider = (function() {
        var _default_options;

        function TouchySlider(elm, options) {
          this.elm = $(elm).first();
          this.options = $.extend({}, _default_options, options);
          if (this.options.handle) {
            this.handle = $(this.options.handle).first();
          }
          this._createSlider();
          this._setupResize();
          this._setupTouchyInstance();
          this._configureValues();
          this._createLabels(this.options.labels);
          this.value(this.options.initial_value);
          this._updateHandlePosition();
          if (this.options.show_bubble) {
            this._createBubble();
          }
          this._updateBubble();
          this.emitEvent('init', [this, this._value]);
          this.elm.css('opacity', 1);
        }

        _default_options = {
          vertical: false,
          min_value: 0,
          max_value: 100,
          initial_value: 0,
          handle: null,
          show_bubble: true,
          bubble_suffix: '',
          bubble_prefix: '',
          values: null,
          labels: []
        };

        TouchySlider.prototype._setupTouchyInstance = function() {
          this._touchy = new Touchy(this.elm, {
            cancel_on_scroll: false
          });
          this._touchy.on('start', (function(_this) {
            return function(event, t, pointer) {
              _this._update();
              _this._setHandleClass(true);
              return _this.emitEvent('start', [event, _this, _this._value]);
            };
          })(this));
          this._touchy.on('move', (function(_this) {
            return function(event, t, pointer) {
              _this._update();
              return _this._setHandleClass(true);
            };
          })(this));
          return this._touchy.on('end', (function(_this) {
            return function(event, t, pointer) {
              _this._update();
              _this._setHandleClass(false);
              return _this.emitEvent('end', [event, _this, _this._value]);
            };
          })(this));
        };

        TouchySlider.prototype._createSlider = function() {
          this.elm.addClass('slider');
          this.elm.addClass(this.options.vertical ? 'slider_v' : 'slider_h');
          this.elm.css({
            position: 'relative'
          });
          this.bar_elm = $("<div class='slider_bar'>");
          this.elm.append(this.bar_elm);
          if (!this.handle) {
            this.handle = $("<div class='slider_handle'>");
            return this.elm.append(this.handle);
          }
        };

        TouchySlider.prototype._createLabels = function(labels) {
          var i, label, label_width, newelm, _i, _len;
          label_width = (100 / labels.length).toFixed(4);
          this.label_elm = $("<div class='slider_labels'>");
          for (i = _i = 0, _len = labels.length; _i < _len; i = ++_i) {
            label = labels[i];
            newelm = $("<div class='slider_label'>");
            newelm.css({
              width: label_width + '%',
              float: 'left',
              textAlign: 'center'
            });
            if (i === 0) {
              newelm.css('textAlign', 'left');
            } else if (i === labels.length - 1) {
              newelm.css({
                float: 'right',
                textAlign: 'right'
              });
            }
            newelm.text(label);
            this.label_elm.append(newelm);
          }
          return this.elm.append(this.label_elm);
        };

        TouchySlider.prototype._createBubble = function() {
          if (!this.options.show_bubble) {
            return;
          }
          this.bubble_elm = $("<div class='slider_bubble'>");
          this.bubble_elm.css({
            position: 'absolute'
          });
          return this.elm.append(this.bubble_elm);
        };

        TouchySlider.prototype._configureValues = function() {
          if (this.options.values && this.options.values.length) {
            this.options.min_value = 0;
            return this.options.max_value = this.options.values.length - 1;
          }
        };

        TouchySlider.prototype._setHandleClass = function(add) {
          if (add == null) {
            add = false;
          }
          if (add) {
            return this.handle.addClass('touching');
          } else {
            return this.handle.removeClass('touching');
          }
        };

        TouchySlider.prototype.value = function(val) {
          if (val != null) {
            this._value = val;
            this._value_pct = this._valueToPercent(val);
            return this;
          } else {
            return this._value;
          }
        };

        TouchySlider.prototype.valuePercent = function(val) {
          if (val != null) {
            this._value_pct = val;
            this._value = this._percentToValue(val);
            return this;
          } else {
            return this._value_pct;
          }
        };

        TouchySlider.prototype._update = function() {
          var pct, pos, val;
          if (this.options.vertical) {
            pos = this._touchy.current_point.y;
          } else {
            pos = this._touchy.current_point.x;
          }
          pct = Math.round(((pos - this._offset) / this._length) * 100);
          if (pct < 0) {
            pct = 0;
          }
          if (pct > 100) {
            pct = 100;
          }
          val = this._percentToValue(pct);
          val = this._trimAlignValue(val);
          if (val !== this._value) {
            this.value(val);
            this._updateHandlePosition();
            this._updateBubble();
            return this.emitEvent('update', [this, event, this._value]);
          }
        };

        TouchySlider.prototype._updateHandlePosition = function() {
          var handle_pos;
          if (this.handle) {
            handle_pos = (this._value_pct / 100) * this._length;
            handle_pos -= this._handleLength / 2;
            if (this.options.vertical) {
              this.handle.css('top', handle_pos);
            } else {
              this.handle.css('left', handle_pos);
            }
            return true;
          }
          return false;
        };

        TouchySlider.prototype._updateBubble = function() {
          var bubble_pos, bubble_text;
          if (this.options.show_bubble && this.bubble_elm) {
            bubble_text = this.options.values && this.options.values.length ? this.options.values[this._value] : this._value;
            this.bubble_elm.text('' + this.options.bubble_prefix + bubble_text + this.options.bubble_suffix);
            bubble_pos = (this._value_pct / 100) * this._length;
            bubble_pos -= this.bubble_elm.outerWidth() / 2;
            if (this.options.vertical) {
              return this.bubble_elm.css('top', bubble_pos);
            } else {
              return this.bubble_elm.css('left', bubble_pos);
            }
          }
        };

        TouchySlider.prototype._valueToPercent = function(val) {
          return ((val - this.options.min_value) / (this.options.max_value - this.options.min_value)) * 100;
        };

        TouchySlider.prototype._percentToValue = function(pct) {
          return ((pct / 100) * (this.options.max_value - this.options.min_value)) + this.options.min_value;
        };

        TouchySlider.prototype._trimAlignValue = function(val) {
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

        TouchySlider.prototype._setupResize = function() {
          $(window).on('resize', (function(_this) {
            return function() {
              return _this._resize();
            };
          })(this));
          return this._resize();
        };

        TouchySlider.prototype._resize = function() {
          if (this.options.vertical) {
            this._length = this.elm.height();
            this._offset = this.elm.offset().top;
            if (this.handle) {
              this._handleLength = this.handle.height();
            }
          } else {
            this._length = this.elm.width();
            this._offset = this.elm.offset().left;
            if (this.handle) {
              this._handleLength = this.handle.width();
            }
          }
          this._updateHandlePosition();
          return true;
        };

        extend(TouchySlider.prototype, EventEmitter.prototype);

        return TouchySlider;

      })();
      return TouchySlider;
    };
    if (typeof define === 'function' && define.amd) {
      return define(['touchy', 'jquery', 'eventEmitter', 'gsap', 'jquery-transform'], TouchySliderDefinition);
    } else if (typeof exports === 'object') {
      return module.exports = TouchySliderDefinition(require('touchy'), require('jquery'), require('wolfy87-eventemitter'), require('gsap'), require('jquery-transform'));
    } else {
      return window.TouchySlider = TouchySliderDefinition(window.Touchy, window.jQuery, window.EventEmitter, window.TweenMax);
    }
  })(window);

}).call(this);
