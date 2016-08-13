'use strict';

angular.module('teamUSAApp')
    .controller('MainCtrl', ['$scope', '$http', 'd3', '_', 'visualizer',
    function ($scope, $http, d3, _, visualizer) {

    function getAthleteAges(data, option) {
        return _.map(angular.copy(data), function (d) {
            return _.map(_.filter(d.athletes, function (d) {
                if (option === 'prev') {
                    return d.prev !== 'NA';
                } else {
                    return d.gender === 'F';
                }
            }), function (d) {
                return d.age;
            });
        });
    }

    //get data and draw SVG
    $http.get('data/data.json').then(function (d) {

        //draw vis first
        visualizer.drawVis(d.data);

        //sorting options
        $scope.sort = 'name-asc';
        $scope.sortSport = function () {
            visualizer.sortVis(d.data, $scope.sort);
        };

        //get count
        var allAthletes = _.flatten(_.pluck(d.data, 'athletes'));
        var all = _.size(allAthletes);
        var women = _.size(_.filter(allAthletes, function (d) {
            return d.gender === 'F';
        }));
        var rookies = _.size(_.filter(allAthletes, function (d) {
            return d.prev === 'NA';
        }));
        $scope.count = {
            all: all,
            women: women,
            men: all - women,
            rookies: rookies,
            prev: all - rookies
        };

        //when option selected
        $scope.$watch('highlight', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                var ages = null;
                if (newVal !== 'all') {
                    ages = getAthleteAges(d.data, newVal);
                }
                visualizer.showHighlights(ages, newVal);
            }
        });
    });


}]);