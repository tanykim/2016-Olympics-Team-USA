'use strict';

angular.module('teamUSAApp').factory('visualizer', ['_', 'd3', function (_, d3) {

    //layout
    var visWidth = document.getElementById('vis').clientWidth;
    var margin = { top: 22, right: 12, bottom: 46, left: 56 };
    var dim = { w: visWidth - margin.left - margin.right };
    dim.h = dim.w;
    var svg;

    //x: height, y: weight
    var x = d3.scaleLinear().range([0, dim.w]);
    var y = d3.scaleLinear().range([dim.h, 0]);
    var axes = {};
    var axesLables = {
        x: { american: 'Height (ft/in)', metric: 'Height (cm)' },
        y: { american: 'Weight (lbs)', metric: 'Weight (kg)' }
    };

    function getRange(data, dimension) {
        var all = _.compact(_.pluck(data, dimension));
        var min = Math.floor(_.min(all) / 10) * 10;
        var max = Math.ceil(_.max(all) / 10) * 10;
        return [min, max];
    }

    this.setAxis = function (data, converter) {

        //ger min and max in metric data
        var xRange = getRange(data, 'height');
        var yRange = getRange(data, 'weight');

        //set default axis in metric
        x.domain(xRange);
        y.domain(yRange);

        //set two units metric
        var xAxis = {
            american: d3.axisBottom(x)
                .tickValues(converter.getAmericanVals(xRange, 30.48, 0.25))
                .tickFormat(function (d) {
                    return converter.getAmericanHeightLabel(d);
                }),
            metric: d3.axisBottom(x)
        };
        var yAxis = {
            american: d3.axisLeft(y)
                .tickValues(converter.getAmericanVals(yRange, 0.453592, 20))
                .tickFormat(function (d) {
                    //to get rounded number, use "html input" function
                    return converter.getAmericanWeightInput(d);
                }),
            metric: d3.axisLeft(y)
        };
        axes = { x: xAxis, y: yAxis };
    };

    this.drawVis = function (data) {

        //draw vis
        svg = d3.select('#vis')
            .append('svg')
            .attr('width', dim.w + margin.left + margin.right)
            .attr('height', dim.h + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        //height range - vertical
        svg.append('line')
            .attr('y2', dim.h)
            .style('opacity', 0.1)
            .style('display', 'none')
            .attr('class', 'stroke-black vis-range-height');
        //weight range - horizontal
        svg.append('line')
            .attr('x2', dim.w)
            .style('opacity', 0.1)
            .style('display', 'none')
            .attr('class', 'stroke-black vis-range-weight');

        //all athletes
        svg.selectAll('.vis-dots')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', function (d) {
                return x(d.height);
            })
            .attr('cy', function (d) {
                return y(d.weight);
            })
            .attr('r', 4)
            .style('fill-opacity', 0.2)
            .style('stroke-width', 0)
            .attr('class', function (d) {
                return 'stroke-black dot-' + d.gender + ' vis-dots';
            })
            .on('mouseover', function (d) {
                svg.append('text')
                    .attr('x', x(d.height))
                    .attr('y', y(d.weight) - 9)
                    .text(d.name + ' (' + d.sport + ')')
                    .attr('class', 'size-small pos-middle dot-text vis-overlay');
                d3.select(this).style('fill-opacity', 1);
            })
            .on('mouseout', function () {
                d3.selectAll('.vis-overlay').remove();
                d3.select(this).style('fill-opacity', 0.2);
            });

        //axis
        svg.append('g')
            .attr('transform', 'translate(0, ' + dim.h + ')')
            .call(axes.x.american)
            .attr('class', 'axis vis-axis-x');
        svg.append('g')
            .call(axes.y.american)
            .attr('class', 'axis vis-axis-y');
        svg.append('text')
            .attr('x', dim.w)
            .attr('y', dim.h + margin.bottom - 6)
            .text(axesLables.x.american)
            .attr('class', 'pos-end size-small vis-axis-x-label');
        svg.append('text')
            .attr('x', 0)
            .attr('y', -margin.left)
            .text(axesLables.y.american)
            .attr('transform', 'rotate(-90)')
            .attr('class', 'pos-end v-top size-small vis-axis-y-label');
    };

    this.showRange = function (height, weight, hr, wr, ids) {
        //make it visible and change the position and stroke width
        svg.select('.vis-range-height')
            .attr('x1', x(height))
            .attr('x2', x(height))
            .style('display', 'block')
            .style('stroke-width', x(height + hr) - x(height - hr));
        svg.select('.vis-range-weight')
            .attr('y1', y(weight))
            .attr('y2', y(weight))
            .style('display', 'block')
            .style('stroke-width', y(weight - wr) - y(weight + wr));
        svg.selectAll('.vis-dots')
            .style('stroke-width', function (d) {
                return _.contains(ids, d.id) ? 1 : 0;
            });
    };

    this.hideRange = function () {
        svg.select('.vis-range-height').style('display', 'none');
        svg.select('.vis-range-weight').style('display', 'none');
        svg.selectAll('.vis-dots').style('stroke-width', 0);
    };

    //when selected unit is changed
    this.switchAxis = function (axis, unit) {
        d3.select('.vis-axis-' + axis).call(axes[axis][unit]);
        d3.select('.vis-axis-' + axis + '-label').text(axesLables[axis][unit]);
    };

    this.toggleGender = function (genders) {
        d3.selectAll('.vis-dots')
            .style('display', function (d) {
                return _.contains(genders, d.gender) ? 'block' : 'none';
            });
    };

    // this.highlightDot = function (id) {
    //     d3.selectAll('.vis-dots')
    //         .style('fill-opacity', function (d) {
    //             return d.id === id ? 1 : 0.2;
    //         });
    // };

    return this;
}]);
