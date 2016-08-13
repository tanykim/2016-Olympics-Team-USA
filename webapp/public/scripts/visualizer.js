'use strict';

angular.module('teamUSAApp').factory('visualizer', ['_', 'd3', function (_, d3) {

    //layout
    var divWidth = 970;
    var margin = { top: 20, right: 10, bottom: 20, left: 140, gap: 16 };
    var dim = { w: divWidth - margin.left - margin.right };
    var gHeight = 50;

    //histogram values
    var x = d3.scaleLinear().range([0, dim.w]);
    var y = d3.scaleLinear().range([gHeight, 0]);
    var minAge = 10;
    var maxAge;

    //vis color
    var colors = {
        all: '#000000', men: '#00298C', rookies: '#087B39',
        violet: '#8900C7',
        grey: '#777777'
    };

    function getHistogram(data) {
        return _.map(angular.copy(data), function (d) {
            return d3.histogram()
                .domain(x.domain())
                .thresholds(maxAge - 10)
                (d);
        });
    }

    function drawHistogram(g, bins, id, option) {

        var bar = g.selectAll('.vis-bar-' + option + '-' + id)
            .data(bins)
            .enter()
            .append('g')
            .attr('class', 'vis-bar-' + option + '-' + id +
                (option !== 'all' ? ' vis-bar-options' : '')
            )
            .attr('transform', function (d) {
                return 'translate(' + x(d.x0) + ', ' + y(d.length) + ')';
            });
        bar.append('rect')
            .attr('x', 0.5)
            .attr('width', x(bins[0].x1) - x(bins[0].x0) - 1)
            .attr('height', function (d) {
                return gHeight - y(d.length);
            })
            .attr('class', 'vis-bar-all bar-' + option);

        if (option === 'all') {
            bar.append('text')
                .attr('x', (x(bins[0].x1) - x(bins[0].x0)) /2)
                .attr('y', -4)
                .text(function (d) {
                    return d.length > 0 ? d.length : '';
                })
                .attr('class', 'size-tiny pos-middle');
        }
    }

    function getAgeText(d) {
        var ageYear = Math.floor(d);
        var ageMonth = Math.floor((d - ageYear) * 12);
        return ageYear + ' years ' + (ageMonth > 0 ? ageMonth + ' m' : '')
    }

    function drawSport(data, g, id, bins) {

        //sports name
        g.append('text')
            .attr('x', -9)
            .attr('y', gHeight / 2)
            .text(data.name)
            .attr('class', 'pos-end v-central vis-g-name');
        g.append('line')
            .attr('x2', dim.w)
            .attr('y1', gHeight)
            .attr('y2', gHeight)
            .attr('class', 'stroke-lightGrey')

        //histogram
        drawHistogram(g, bins, id, 'all');

        //draw athletes count
        g.append('text')
            .attr('x', -9)
            .attr('y', gHeight - margin.gap)
            .attr('dy', 14)
            .text(data.athletes.length + ' athletes')
            .style('display', 'none')
            .attr('class', 'pos-end size-small fill-sorted web-font vis-g-highlight vis-g-count');

        //draw median age
        g.append('line')
            .attr('x1', x(data.median_age))
            .attr('x2', x(data.median_age))
            .attr('y2', gHeight / 2)
            .style('display', 'none')
            .attr('class', 'stroke-sorted vis-g-highlight vis-g-median');
        g.append('circle')
            .attr('cx', x(data.median_age))
            .attr('cy', gHeight / 4)
            .attr('r', 4)
            .style('display', 'none')
            .attr('class', 'fill-sorted vis-g-highlight vis-g-median');
        g.append('text')
            .attr('x', x(data.median_age) + 6)
            .attr('y', gHeight / 4)
            .text(getAgeText(data.median_age))
            .style('display', 'none')
            .attr('class', 'v-central size-small vis-g-highlight vis-g-median fill-sorted web-font');

        //draw age range
        g.append('line')
            .attr('x1', x(data.age_range[0]))
            .attr('x2', x(data.age_range[1]))
            .style('display', 'none')
            .attr('class', 'stroke-sorted vis-g-highlight vis-g-range');
        g.append('circle')
            .attr('cx', x(data.age_range[0]))
            .attr('r', 4)
            .style('display', 'none')
            .attr('class', 'fill-sorted vis-g-highlight vis-g-range');
        g.append('circle')
            .attr('cx', x(data.age_range[1]))
            .attr('r', 4)
            .style('display', 'none')
            .attr('class', 'fill-sorted vis-g-highlight vis-g-range');
        g.append('text')
            .attr('x', x((data.age_range[1] + data.age_range[0]) / 2))
            .attr('dy', 4)
            .text(getAgeText(data.age_range[1] - data.age_range[0]))
            .style('display', 'none')
            .attr('class', 'v-top pos-middle size-small fill-sorted web-font vis-g-highlight vis-g-range');
    }

    this.drawVis = function (data) {

        //draw vis
        dim.h = data.length * (gHeight + margin.gap);

        var svg = d3.select('#vis')
            .append('svg')
            .attr('width', dim.w + margin.left + margin.right)
            .attr('height', dim.h + margin.top + margin.bottom);

        //histogram data
        //get age range by 10s
        var allAges = _.map(data, function (d) {
            return _.pluck(d.athletes, 'age');
        });
        maxAge = Math.ceil(_.max(_.flatten(allAges)) / 10) * 10;
        x.domain([minAge, maxAge]);

        //draw a axis
        var axisG = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
        //every 5 years
        var axisCount = (maxAge - minAge) / 5;
        //+1 for the last vertical line
        _.each(_.range(axisCount + 1), function (i) {
            var xPos = i * dim.w / axisCount + 0.5;
            axisG.append('line')
                .attr('x1', xPos)
                .attr('x2', xPos)
                .attr('y2', dim.h)
                .attr('class', 'stroke-lightGrey')
                .style('stroke-dasharray', gHeight + ', ' + margin.gap);

            //put axis text every 5 sports
            var axisTextCount = Math.ceil(data.length / 4);
            _.each(_.range(axisTextCount), function (j) {
                var yPos = j * (gHeight + margin.gap) * 4 + gHeight + 4;
                axisG.append('text')
                    .attr('x', xPos)
                    .attr('y', yPos)
                    .text(minAge + i * 5) // minimum age + every 5 years
                    .attr('class', 'size-tiny pos-middle v-top fill-lightGrey');
                //age 15 and 40
                if (i === 0 || i === 4) {
                    axisG.append('text')
                        .attr('x', xPos + 8)
                        .attr('y', yPos)
                        .text('years old')
                        .attr('class', 'size-tiny v-top fill-lightGrey');
                }
            });
        });

        //draw g for each sport
        svg.selectAll('.vis-g')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', function (d) {
                return 'translate(' + margin.left + ' ,' + (margin.top + d.id * (gHeight + margin.gap)) + ')';
            })
            .attr('class', function (d) {
                return 'vis-g vis-g-' + d.id;
            });

        //histogram every year
        var histogram = getHistogram(allAges);

        //max number of athletes per sport
        var maxCount = _.max(_.map(histogram, function (bins) {
            return d3.max(bins, function(d) { return d.length; });
        }));
        y.domain([0, maxCount]);

        //draw vis of each sport
        _.each(data, function (d, i) {
            drawSport(d, d3.select('.vis-g-' + d.id), d.id, histogram[i]);
        });
    };

    this.showHighlights = function (data, option) {

        //remove previously highlighted bars
        d3.selectAll('.vis-bar-options').remove();

        //update bar colors of all atheletes
        var newBarColor = colors.all;
        if (option === 'women') {
            newBarColor = colors.men;
        } else if (option === 'prev') {
            newBarColor = colors.rookies;
        }
        d3.selectAll('.vis-bar-all').style('fill', newBarColor);

        //draw histogram of highights
        if (option !== 'all') {
            var histogram = getHistogram(data);
            _.each(data, function (d, i) {
                drawHistogram(d3.select('.vis-g-' + i), histogram[i], i, option);
            });
        }
    };

    function sortArray(option, a, b) {
        if (option === 'name-asc') {
            return a.id - b.id;
        } else if (option === 'count-desc') {
            return b.athletes.length - a.athletes.length;
        } else if (option === 'count-asc') {
            return a.athletes.length - b.athletes.length;
        } else if (option === 'median-desc') {
            return b.median_age - a.median_age;
        } else if (option === 'median-asc') {
            return a.median_age - b.median_age;
        } else if (option === 'range-desc') {
            return (b.age_range[1] - b.age_range[0]) - (a.age_range[1] - a.age_range[0]);
        } else if (option === 'range-asc') {
            return (a.age_range[1] - a.age_range[0]) - (b.age_range[1] - b.age_range[0]);
        }
    }

    this.sortVis = function (data, option) {

        //resort dataset
        var sorted = _.map(angular.copy(data).sort(function (a, b) {
                return sortArray(option, a, b);
            }), function (d) {
                return d.id;
            });

        //transition
        d3.selectAll('.vis-g')
            .transition().duration(1000)
            .attr('transform', function (d) {
                return 'translate(' + margin.left + ', ' +
                    (margin.top + sorted.indexOf(d.id) * (gHeight + margin.gap)) +
                    ')';
            })
            .on('end', function () {
                var o = option.split('-')[0];
                d3.selectAll('.vis-g-highlight').style('display', 'none');
                d3.selectAll('.vis-g-' + o).transition().style('display', 'block');
            });

    };

    return this;
}]);
