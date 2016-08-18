'use strict';

angular.module('teamUSAApp')
    .controller('MainCtrl', ['$scope', '$http', '$anchorScroll', '$location', 'd3', '_', 'visualizer', 'converter',
    function ($scope, $http, $anchorScroll, $location, d3, _, visualizer, converter) {

    /***
    Load dataset and draw the base vis
    ***/

    function getGenderCount(data) {
        var byGender = _.groupBy(data, function (a) {
            return a.gender;
        });
        return { m: _.size(byGender.M), f: _.size(byGender.F) };
    }

    //get data and draw SVG
    var allAthletes;
    $http.get('data/athletes.json').then(function (d) {

        //set axis
        visualizer.setAxis(d.data, converter);

        //draw scatterplot first
        visualizer.drawVis(d.data, $scope.getSelectedDotId);

        //put athletes list
        allAthletes = d.data;
        $scope.count = getGenderCount(angular.copy(allAthletes));

        $scope.isLoaded = true;
    });

    /***
    Enter height and weight control in two units
    ***/

    //user input
    $scope.unit = { height: 'american', weight: 'american' };
    $scope.height = { ft: '5', in: '8', cm: '' };
    $scope.weight = { lbs: '200', kg: '' };

    //when a unit selected, update values in other units
    $scope.$watch('unit', function (newVal, oldVal) {
        if (newVal.height !== oldVal.height) {
            if (newVal.height === 'metric') {
                $scope.height.cm = converter.getMetricHeightInput($scope.height);
            } else {
                var amh = converter.getAmericanHeightInput($scope.height.cm);
                $scope.height.ft = amh[0];
                $scope.height.in = amh[1];
            }
            visualizer.switchAxis('x', newVal.height);
        }
        if (newVal.weight !== oldVal.weight) {
            if (newVal.weight === 'metric') {
                $scope.weight.kg = converter.getMetricWeightInput($scope.weight.lbs);
            } else {
                $scope.weight.lbs = converter.getAmericanWeightInput($scope.weight.kg);
            }
            visualizer.switchAxis('y', newVal.weight);
        }
    }, true);

    //when new input entered, disable the button
    $scope.$watch('height', function () {
        $scope.isFound = false;
        $scope.selectedGenders = ['F', 'M'];
    }, true);
    $scope.$watch('weight', function () {
        $scope.isFound = false;
        $scope.selectedGenders = ['F', 'M'];
    }, true);

    /***
    Find athletes in the given height and weight
    ***/

    //all found athletes before filtering
    var foundAthletes;

    //search range in american unit +- seen in the HTML
    $scope.range = {
        american: { height: 1, weight: 2 },
        metric: { height: 2, weight: 1 },
    };

    //result filter by gender
    $scope.selectedGenders = ['F', 'M'];
    function filterByGender() {
        return _.filter(angular.copy(foundAthletes), function (a) {
            return _.contains($scope.selectedGenders, a.gender);
        });
    }
    $scope.$watch('selectedGenders', function () {
        $scope.athletes = filterByGender();
        visualizer.toggleGender($scope.selectedGenders);
    }, true);

    function filterAthletes(height, weight, hr, wr) {
        var filtered = _.sortBy(_.filter(angular.copy(allAthletes), function (a) {
                //floor or ceil to include abnormal .99999998 cases
                return (a.height >= Math.floor(height - hr)) &&
                    (a.height <= Math.ceil(height + hr)) &&
                    (a.weight >= Math.floor(weight - wr)) &&
                    (a.weight <= Math.ceil(weight + wr));
            }), function (a) {
                return Math.abs(a.height - height) + Math.abs(a.weight - weight);
            });
        //convert metric height and weight into readable format
        return _.map(filtered, function (d) {
            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            return {
                name: d.name,
                id: d.id,
                sport: d.sport,
                age: Math.floor(d.age),
                gender: d.gender,
                height: {
                    american: d.height_original,
                    metric: d.height.toFixed(1) + 'cm'
                },
                weight: {
                    american: d.weight_original + 'lbs',
                    metric: d.weight.toFixed(1) + 'kg'
                }
            };
        });
    }

    //check if both height and weight have valid input (0 is not allowed)
    function isValidInput () {
        var hs = $scope.unit.height === 'american' ?
            ($scope.height.ft !== '' || $scope.height.in !== '' ? true : false) :
            ($scope.height.cm !== '' ? true : false);
        var ws = $scope.unit.weight === 'american' ?
            ($scope.weight.lbs !== '' ? true : false) :
            ($scope.weight.kg !== '' ? true : false);
        return hs && ws ? true : false;
    }

    //when [find athletes] button is clicked
    $scope.isFound = false;
    $scope.findAthletes = function () {

        //check if all inputs are valid first
        if (!isValidInput()) {
            return false;
        }

        //get height and weight and their range in metric unit
        var height = +$scope.height.cm;
        var weight = +$scope.weight.kg;
        var hr = $scope.range.metric.height;
        var wr = $scope.range.metric.weight;

        //convert to metric if american unit is selected
        if ($scope.unit.height === 'american') {
            height = converter.getMetricHeight($scope.height);
            hr = $scope.range.american.height * 2.54; //every * inch
        }
        if ($scope.unit.weight === 'american') {
            weight = converter.getMetricWeight(+$scope.weight.lbs);
            wr = $scope.range.american.weight * 0.453592; //every * lbs
        }

        //get athletes in the range before filtering
        foundAthletes = filterAthletes(height, weight, hr, wr);
        $scope.athletes = angular.copy(foundAthletes);
        $scope.athletesCount = getGenderCount(angular.copy($scope.athletes));

        //filter by gender
        $scope.athletes = filterByGender();

        $scope.isFound = true;

        //show height and weight range in vis, highlight dots in the range
        var idsInRange = _.pluck($scope.athletes, 'id');
        visualizer.showRange(height, weight, hr, wr, idsInRange);
    };

    //when new input is entered, hide the range
    $scope.$watch('isFound', function (newVal, oldVal) {
        if (newVal !== oldVal && !newVal) {
            visualizer.hideRange();
        }
    });

    //when range is updated, re-find athletes
    $scope.$watch('range', function (newVal, oldVal) {
        if (newVal[$scope.unit.height].height !== oldVal[$scope.unit.height].height ||
            newVal[$scope.unit.weight].weight !== oldVal[$scope.unit.weight].weight) {
            $scope.findAthletes();
        }
    }, true);

    $scope.highlightDot = function (id) {
        visualizer.highlightDot(id);
    };

}]);