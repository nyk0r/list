(function (global, angular) {
   'use strict';
   angular.module('list', []).
      factory('lsDataSource', ['$http', '$q', function ($http, $q) {
         /*jshint validthis:true */
         function entityState () {
            var states = [
                  this.build.state(),
                  this.metrics.state(),
                  this.unitTests.state(),
                  this.functionalTests.state()
                ],
                progress = [
                  this.build.progress,
                  this.metrics.progress,
                  this.unitTests.porgress,
                  this.functionalTests.progress
                ];

            function hasFaild () {
               for (var idx = 0; idx < states.length; idx++) {
                  if (states[idx] === 'fail') {
                     return true;
                  }
               }
               return false;
            }

            function inProgress () {
               for (var idx = 0; idx < progress.length; idx++) {
                  if (progress[idx] < 100) {
                     return true;
                  }
               }
               return false;
            }

            if (!this.startTime) {
               return 'pending';
            } else if (hasFaild()) {
               return 'fail';
            } else if (inProgress()) {
               return 'running';
            }
            else {
               return 'success';
            }
         }

         function buildState () {
            if (!this.release || !this.debug) {
               return 'fail';
            }

            if (!this.progress) {
               return 'pending';
            }
            if (this.progress < 100) {
               return 'running';
            }

            return 'success';
         }

         function metricsState () {
            if (this.progress === 0) {
               return 'pending';
            } else if (this.progress < 100) {
               return 'running';
            } else {
               return this.test < 60 ||
                      this.maintainability < 60 ||
                      this.security < 60 ||
                      this.workmanship < 60 ? 'fail' : 'success';
            }
         }

         function testsPercentsPassed () {
            return global.Math.round(this.passedCount / (this.faildCount + this.passedCount) * 100);
         }
         function testsState () {
            if (this.progress === 0) {
               return 'pending';
            } else if (this.progress < 100) {
               return 'running';
            } else {
               return this.percentsPassed() < 60 ? 'fail' : 'success';
            }
         }

         function fetchData () {
            var deferred = $q.defer();

            $http.get('data.json').success(function(data, status, headers, config) {
               angular.forEach(data, function (entity) {
                  entity.state = entityState;
                  entity.metrics.state = metricsState;
                  entity.build.state = buildState;
                  entity.unitTests.percentsPassed = entity.functionalTests.percentsPassed = testsPercentsPassed;
                  entity.unitTests.state = entity.functionalTests.state = testsState;
               });

               deferred.resolve(data);
            });

            return deferred.promise;
         }

         return {
            get: fetchData
         };
      }]).
      filter('uppercaseFirst', function () {
         return function (str) {
            return str[0].toUpperCase() + str.slice(1);
         };
      }).
      directive('lsProgress', function () {
         return {
            template: [
               '<div class="progress">',
                  '<div class="progress__indicator"></div>',
               '</div>',
            ].join(''),
            restrict: 'E',
            scope: {
               state: '=lsState',
               value: '=lsValue'
            },
            link: function (scope, element, attrs, ngModelController) {
               scope.$watch('state', function (val) {
                  var indicator = element.find('.progress__indicator'),
                      classes = indicator[0].className.split(/\s/g),
                      idx;

                  for (idx = 0; idx < classes.length; idx++) {
                     if (/progress__indicator--.+/.test(classes[idx])) {
                        indicator.removeClass(classes[idx]);
                     }
                  }
                  indicator.addClass('progress__indicator--' + val);
               });
               scope.$watch('value', function (val) {
                  element.find('.progress__indicator').width(val + '%');
               });
            }
         };
      }).
      directive('lsPie', function () {
         return {
            template: '<div class="pie-chart"></div>',
            restrict: 'E',
            scope: {
               series: '=lsSeries',
               colors: '=lsColors'
            },
            link: function (scope, element, attrs, ngModelController) {
               scope.$watch(
                  function () {
                     var series = scope.series,
                         colors = scope.colors,
                         data = [],
                         len = series.length,
                         idx;

                     if (!angular.isArray(series) || !angular.isArray(colors) || series.length !== colors.length) {
                        throw new Error('Arguments Exception');
                     }

                     for (idx = 0; idx < len; idx++) {
                        data.push({
                           data: series[idx],
                           color: colors[idx]
                        });
                     }

                     return data;
                  },
                  function (value) {
                     element.find('.pie-chart').plot(value, {
                         series: {
                             pie: {
                                 show: true
                             }
                         },
                         grid: {
                             hoverable: true
                         }
                     });
                  },
                  true
               );
            }
         };
      }).
      controller('lsMain', ['$scope', 'lsDataSource', function ($scope, dataSource) {
         var selectedItemIdx;

         dataSource.get().then(function (data) {
            $scope.list = data;
         });

         $scope.select = function (idx) {
            if (selectedItemIdx === idx) {
               selectedItemIdx = null;
            } else {
               selectedItemIdx = idx;
            }
         };

         $scope.selected = function (idx) {
            return selectedItemIdx === idx;
         };

         $scope.sort = function (field) {
            selectedItemIdx = null;

            if ($scope.sortField === field) {
               if ($scope.sortDir === 'asc') {
                  $scope.sortDir = 'desc';
               } else {
                  $scope.sortField = null;
                  $scope.sortDir = null;
               }
            } else {
               $scope.sortField = field;
               $scope.sortDir = 'asc';
            }
         };

         $scope.computeProgressColor = function (value) {
            var success = value / 100,
                fail = (100 - value) / 100;

            return '#' +
                   global.Math.round(fail * 255).toString(16) +
                   global.Math.round(success * 255).toString(16) + '00';
         };
      }]);
}) (window, window.angular);
