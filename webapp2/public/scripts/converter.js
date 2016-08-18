'use strict';

angular.module('teamUSAApp').factory('converter', function () {

    this.getMetricHeight = function (h) {
        return (+h.ft * 30.48) + (+h.in * 2.54);
    };
    this.getAmericanHeight = function (cm) {
        var inch = cm / 2.54;
        var foot = Math.floor(inch / 12);
        var remain = Math.round(inch - (foot * 12));
        return [foot, remain];
    };
    this.getMetricWeight = function (lbs) {
        return lbs * 0.453592;
    };
    this.getAmericanWeight = function (kg) {
        return kg / 0.453592;
    };

    /* from main.js - HTML input */
    //html input as string -> convert to number
    this.getMetricHeightInput = function (h) {
        if (h.ft === '' && h.in === '') {
            return '';
        } else {
            return Math.round(this.getMetricHeight(h));
        }
    };
    this.getMetricWeightInput = function (lbs) {
        console.log(lbs);
        if (lbs === '') {
            return '';
        } else {
            return Math.round(this.getMetricWeight(+lbs));
        }
    };
    this.getAmericanHeightInput = function (cm) {
        if (cm === '') {
            return ['', ''];
        } else {
            return this.getAmericanHeight(+cm);
        }
    };
    this.getAmericanWeightInput = function (kg) {
        if (kg === '') {
            return '';
        } else {
            return Math.round(this.getAmericanWeight(+kg));
        }
    };

    /* from vis.js - visualization values */
    this.getAmericanVals = function (range, cRate, times) {
        //conversion rate: metric / cRate = american
        //times: every times american unit (every quarter inch, every 20 pounds)
        var min = Math.ceil(range[0] / cRate / times);
        var max = Math.floor(range[1] / cRate / times);
        var vals = [];
        for (var i = min; i <= max; i++) {
            vals.push(i * cRate * times);
        }
        return vals;
    };
    this.getAmericanHeightLabel = function (cm) {
        var val = this.getAmericanHeight(cm);
        return val[0] + '\' ' +
            (val[1] > 0 ? val[1] : '');

    };

    return this;
});

