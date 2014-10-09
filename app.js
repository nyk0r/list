(function (global, angular) {
   'use strict';
   angular.module('list', []).
      factory('lsDataSource', [function (){
         function Entity () { };
         Entity.prototype.state = function () {
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
         };

         function Build () {};
         Build.prototype.state = function () {
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
         };

         function Metrics () {};
         Metrics.prototype.state = function () {
            if (this.progress === 0) {
               return 'pending'
            } else if (this.progress < 100) {
               return 'running';
            } else {
               return this.test < 60 ||
                      this.maintainability < 60 ||
                      this.security < 60 ||
                      this.workmanship < 60 ? 'fail' : 'success';
            }
         };

         function Tests () {};
         Tests.prototype.state = function () {
            if (this.progress === 0) {
               return 'pending'
            } else if (this.progress < 100) {
               return 'running';
            } else {
               return this.passedCount / (this.faildCount + this.passedCount) < 0.6 ? 'fail' : 'success';
            }
         };

         function generateData () {
            var max = 10,
               idx,
               rnd = global.Math.random,
               rndBool = function () { return rnd() > 0.5 ? true : false },
               rnd100  = function () { return global.Math.ceil(rnd() * 100) },
               rndStr  = function (len) {
                   var source = 'abcdefghijklmnopqrstuvwzyz0123456789_-',
                       idx,
                       result = [];

                   for (idx = 0; idx < len; idx++) {
                      result.push(source[global.Math.round(rnd()*source.length)]);
                   }

                   return result.join('');
               },
               rndStatus = function () {
                   return rnd() <= 0.8 ? 100 : rnd100();
               },
               rndFailed = function () {
                   return rndBool() ? 0 : rnd100();
               },
               result = [];

            for (idx = 0; idx < max; idx++) {
               result.push(angular.extend(new Entity(), {
                  type: rndBool() ? 'firewall' : 'build',
                  name: rndStr(10),
                  owner: rndStr(10),
                  startTime: rndBool() ? null : new Date((new Date()).valueOf() - rnd() * 10000),
                  metrics: angular.extend(new Metrics(), {
                     progress: rndStatus(),
                     test: rndStatus(),
                     maintainability: rndStatus(),
                     security: rndStatus(),
                     workmanship: rndStatus(),
                  }),
                  build: angular.extend(new Build(), {
                     progress: rndStatus(),
                     debug: rnd() <= 0.7,
                     release: rnd() <= 0.7
                  }),
                  unitTests: angular.extend(new Tests(), {
                     progress: rndStatus(),
                     passedCount: rnd100(),
                     faildCount: rnd() * 20,
                     coverage: rnd100()
                  }),
                  functionalTests: angular.extend(new Tests(), {
                     progress: rndStatus(),
                     passedCount: rnd100(),
                     faildCount: rnd() * 20,
                     coverage: rnd100()
                  })
               }))
            }

            return result;
         }

         return {
            get: generateData
         }
      }]).
      filter('uppercaseFirst', function () {
         return function (str) {
            return str[0].toUpperCase() + str.slice(1);
         }
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
         }
      }).
      controller('main', ['$scope', 'lsDataSource', function ($scope, dataSource) {
         var selectedItemIdx;

         $scope.list = dataSource.get();

         $scope.select = function (idx) {
            if (selectedItemIdx === idx) {
               selectedItemIdx = null;
            } else {
               selectedItemIdx = idx
            }
         }

         $scope.selected = function (idx) {
            return selectedItemIdx === idx;
         }

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
         }
      }]);
}) (window, window.angular);
