/**
 *
 * Created by josephblau on 3/25/14.
 */

/*
 * getStyleObject Plugin for jQuery JavaScript Library
 * From: http://upshots.org/?p=112
 *
 * Copyright: Unknown, see source link
 * Plugin version by Dakota Schneider (http://hackthetruth.org)
 */
(function($){
  $.fn.getStyleObject = function(){
    var dom = this.get(0);
    var style;
    var returns = {};
    if(window.getComputedStyle){
      var camelize = function(a,b){
        return b.toUpperCase();
      }
      style = window.getComputedStyle(dom, null);
      for(var i=0;i<style.length;i++){
        var prop = style[i];
        var camel = prop.replace(/-([a-z])/g, camelize);
        var val = style.getPropertyValue(prop);
        returns[camel] = val;
      }
      return returns;
    }
    if(dom.currentStyle){
      style = dom.currentStyle;
      for(var prop in style){
        returns[prop] = style[prop];
      }
      return returns;
    }
    return this.css();
  }
})(jQuery);
/* Convert Kelvin to RGB: based on http://bit.ly/1bc83he */
function kelvinToHSV(kelvin) {
  var temperature = kelvin / 100;
  var red;
  if(temperature <= 66) {
    red = 255;
  } else {
    red = temperature - 60;
    red = 329.698727446 * Math.pow(red, -0.1332047592);
    if(red < 0) red = 0;
    if(red > 255) red = 255;
  }
  var green;
  if(temperature <= 66) {
    green = temperature;
    green = 99.4708025861 * Math.log(green) - 161.1195681661;
    if(green < 0) green = 0;
    if(green > 255) green = 255;
  } else {
    green = temperature - 60;
    green = 288.1221695283 * Math.pow(green, -0.0755148492);
    if(green < 0) green = 0;
    if(green > 255) green = 255;
  }
  var blue;
  if(temperature >= 66) {
    blue = 255;
  } else {
    if(temperature <= 19) {
      blue = 0;
    } else {
      blue = temperature - 10;
      blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
      if(blue < 0) blue = 0;
      if(blue > 255) blue = 255;
    }
  }
  var color = new RGBColour(red, green, blue);
  return color.getHSV();
}
// disable web fonts in windows otherwise text may be unreadable if cleartype is disabled :(
if (navigator.appVersion.indexOf("Win")!=-1) {
  $('#content h1').css('font-family', 'arial, sans-serif');
  $('#content p').css('font-family', 'arial, sans-serif');
  $('#content form').css('font-family', 'arial, sans-serif');
  $('#content input').css('font-family', 'arial, sans-serif');
}
var currentState            = $('#current-state');
var backgroundFill          = $('#current-state .background-fill');
var bulb                    = $('#current-state .bulb');
var bulbHighlight           = $('#current-state .bulb-highlight');
var bulbDiffuser            = $('#current-state .bulb-diffuser');
var bulbShadow              = $('#current-state .bulb-shadow');
var previousState           = $('#previous-state');
var previousBackgroundFill  = $('#previous-state .background-fill');
var previousBulb            = $('#previous-state .bulb');
var previousBulbHighlight   = $('#previous-state .bulb-highlight');
var previousBulbDiffuser    = $('#previous-state .bulb-diffuser');
var previousBulbShadow      = $('#previous-state .bulb-shadow');
var previousTargetCSS;
function copyComputedStyles(sourceObject, destinationObject) {
  var style = sourceObject.getStyleObject()
  destinationObject.css(style);
}
function colorChange(h, s, b, k, transitionTime) {
  // special case for when kelvin is specified
  // ignore kelvin value unless saturation is 0
  if(k > 0 && s < 1) {
    var kelvin = kelvinToHSV(k);
    h = kelvin.h;
    s = kelvin.s;
  }
  // convert lifx HSB (also known as HSV) into something css can grok (i.e. HSL)
  // h is in the range [0,360), s and v are in the range [0,100]
  var targetHSV = new HSVColour(h, s, b);
  var targetHSL = targetHSV.getHSL();
  var targetCSS = targetHSL.h + ',' + targetHSL.s + '%,' + targetHSL.l + '%';
  // do nothing if the color hasn't changed from previous execution
  if(targetCSS == previousTargetCSS) return;
  previousTargetCSS = targetCSS;
  if(transitionTime < 1) transitionTime = 0;
  // copy previous styles to background state
  copyComputedStyles(backgroundFill, previousBackgroundFill);
  copyComputedStyles(bulb, previousBulb);
  copyComputedStyles(bulbHighlight, previousBulbHighlight);
  copyComputedStyles(bulbDiffuser, previousBulbDiffuser);
  copyComputedStyles(bulbShadow, previousBulbShadow);
  // hide current layer, show previous so that we can transition to new layer/state
  currentState
    .css('-webkit-transition', 'none')
    .css('-moz-transition', 'none')
    .css('-o-transition', 'none')
    .css('transition', 'none');
//    .css('opacity', 0);
  previousState.css('opacity', 1);
  // support transitions in Chrome
  currentState.css('opacity');
  // style up the lighting effects
  backgroundFill
    .css('background-color', 'hsl(' + targetCSS + ')')
    .css('background', 'radial-gradient(ellipse at 30% 50%, hsla(' + targetCSS + ',0.85) 0%, hsla(' + targetCSS + ',0.55) 35%, hsla(' + targetCSS + ',0.1) 100%)')
    .css('opacity', 1);
  // low compatibility mode for browsers that don't fully support fancy css filters
  // ie. firefox / ie / opera
  var userAgent = navigator.userAgent;
  if(userAgent.indexOf('Firefox') > -1 || userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Opera') > -1) {
    bulb
      .css('opacity', '0.8');
    bulbDiffuser
//      .css('background-image', 'url(./images/bulb-diffuser.png)')
      .css('opacity', ((targetHSL.l/100)*2)*2);
  } else { // full compatibility
    bulbHighlight
//      .css('background-image', 'url(./images/bulb-highlight.png)')
      .css('-webkit-filter', 'saturate('+(targetHSL.s*100)+'%) hue-rotate(' + targetHSL.h + 'deg) blur(25px)')
      .css('-moz-filter', 'saturate('+(targetHSL.s*100)+'%) hue-rotate(' + targetHSL.h + 'deg) blur(25px)')
      .css('-o-filter', 'saturate('+(targetHSL.s*100)+'%) hue-rotate(' + targetHSL.h + 'deg) blur(25px)')
      .css('-ms-filter', 'saturate('+(targetHSL.s*100)+'%) hue-rotate(' + targetHSL.h + 'deg) blur(25px)')
      .css('filter', 'saturate('+(targetHSL.s*100)+'%) hue-rotate(' + targetHSL.h + 'deg) blur(25px)')
      .css('opacity', (targetHSL.l/100)*2);
    bulbDiffuser
//      .css('background-image', 'url(./images/bulb-diffuser.png)')
      .css('-webkit-filter', 'saturate(1000%) hue-rotate(' + targetHSL.h + 'deg)')
      .css('-moz-filter', 'saturate(1000%) hue-rotate(' + targetHSL.h + 'deg)')
      .css('-o-filter', 'saturate(1000%) hue-rotate(' + targetHSL.h + 'deg)')
      .css('-ms-filter', 'saturate(1000%) hue-rotate(' + targetHSL.h + 'deg)')
      .css('filter', 'saturate(1000%) hue-rotate(' + targetHSL.h + 'deg)')
      .css('opacity', ((targetHSL.l/100)*2)*2);
    bulbShadow
      .css('background-image', 'url(./images/bulb-shadow.png)')
      .css('opacity', 1 - (targetHSL.l/100)*2);
  }
  // transition between layers/states
  currentState
//    .css('-webkit-transition', 'opacity ' +(transitionTime/1000)+ 's linear')
//    .css('-moz-transition', 'opacity ' +(transitionTime/1000)+ 's linear')
//    .css('-o-transition', 'opacity ' +(transitionTime/1000)+ 's linear')
//    .css('transition', 'opacity ' +(transitionTime/1000)+ 's linear')
    .css('opacity', 1);
}
function preload(arrayOfImages) {
  $(arrayOfImages).each(function () {
    $('<img />').attr('src',this).appendTo('body').css('display','none');
  });
}
preload([
  'images/bulb-diffuser.png',
  'images/bulb-highlight.png',
  'images/bulb-shadow.png'
]);
// for demo
$('#demo').submit(function(event) {
  event.preventDefault();
  colorChange($('#form_h').val(), $('#form_s').val(), $('#form_b').val(), $('#form_k').val(), $('#form_t').val());
});