module.exports = function (grunt) {
   grunt.initConfig({
      less: {
         all: {
            options: {
               compress: false
            },
            files: {
            }
         }
      },

      autoprefixer: {
         all: {
            files: {
            }
         },
         options: {
            browsers: ['last 2 versions', 'ie 9', 'ie 8', 'Firefox ESR']
         }
      },

      connect: {
       server: {
            options: {
               port: 8383,
               base: '.'
            }
         }
      },

      watch: {
         all: {
            files: ['styles/**/*.less'],
            tasks: ['less', 'autoprefixer']
         }
      },

      wiredep: {
         all: {
            src: 'index.html'
         }
      },
   });

   grunt.loadNpmTasks('grunt-contrib-less');
   grunt.loadNpmTasks('grunt-autoprefixer');
   grunt.loadNpmTasks('grunt-contrib-connect');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-wiredep');

   grunt.registerTask('default', ['less', 'autoprefixer', 'connect', 'wiredep', 'watch']);
   grunt.registerTask('build', ['less', 'autoprefixer', 'wiredep']);
};
