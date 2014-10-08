(function (global, angular) {
   'use strict';
   angular.module('list', []).
      factory('lsDataSource', [function (){
         function Entity () { };
         Entity.prototype.state = function () {
            var statuses = [
               this.metrics.status(),
               this.unitTests.status(),
               this.functionalTests.status()];
            if ('pending' in status) {
               return 'pending';
            } else if ('fail' in status) {
               return 'fail';
            } else {
               return 'success';
            }
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
                      this.workmanship < 60 ? 'error' : 'success';
            }
         };

         function Tests () {};
         Tests.prototype.state = function () {
            if (this.progress === 0) {
               return 'pending'
            } else if (this.progress < 100) {
               return 'running';
            } else {
               return this.faildCount / (this.faildCount + passedCount) < 0.6 ? 'fail' : 'success';
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
                   return rndBool() ? 100 : rnd100();
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
                  startTime: new Date((new Date()).valueOf() - rnd() * 10000),
                  metrics: angular.extend(new Metrics(), {
                     progress: rndStatus(),
                     test: rndStatus(),
                     maintainability: rndStatus(),
                     security: rndStatus(),
                     workmanship: rndStatus(),
                  }),
                  build: {
                     debug: rndBool(),
                     release: rndBool()
                  },
                  unitTests: angular.extend(new Tests(), {
                     passedCount: rnd100(),
                     faildCount: rndFailed(),
                     coverage: rnd100()
                  }),
                  functionalTests: angular.extend(new Tests(), {
                     passedCount: rnd100(),
                     faildCount: rndFailed(),
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
      directive('lsProgress', function () {
         return {
            template: [
               '<div class="progress">',
                  '<div class="progress__indicator"></div>',
               '<div>',
            ].join(''),
            restrict: 'A',
            scope: {
               state: '@lsState',
               value: '@lsValue'
            }
         };
      }).
      controller('main', ['$scope', 'lsDataSource', function ($scope, dataSource) {
         $scope.list = dataSource.get();
      }]);
}) (window, window.angular);
