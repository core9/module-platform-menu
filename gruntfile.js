module.exports = function(grunt) {
  
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-http');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-ngmin');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      dist: {
        // the files to concatenate
        src: ['build/**/*.js'],
        // the location of the resulting JS file
        dest: 'bin/<%= pkg.name %>.js'
      }
    },
    
    copy: {
      build_js: {
        files: [{
          src: ['**/*.js'],
          dest: 'build',
          cwd: 'src',
          expand: true
        }]
      }
    },

    html2js: {
      app: {
        options: {
          base: 'src',
          module: 'templates-<%= pkg.name %>',
          prefix: '<%= pkg.tplprefix %>',
          rename: function (moduleName) {
            grunt.log.write(JSON.stringify(this));
            return this.prefix + moduleName;
          }
        },
        src: [ 'src/**/*.tpl.html' ],
        dest: 'build/templates.js'
      }
    },

    uglify: {
      compile: {
        options: {
          banner: '// Core9 - Module: <%= pkg.name %>\n'
        },
        files: {
          '<%= concat.dist.dest %>': '<%= concat.dist.dest %>'  
        }
      }
    },

    ngmin: {
      compile: {
        files: [{
          src: [ '**/*.js' ],
          cwd: 'build',
          dest: 'build',
          expand: true
        }]
      }
    },

    jshint: {
      src: ['src/**/*.js'],
      gruntfile: ['gruntfile.js'],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true
      },
      globals: {}
    },

    http: {
      compile: {
        options: {
          url: 'http://localhost:8080/admin/files/<%= pkg.id %>?contents',
          method: 'PUT',
          json: {
            content: "content"
          },
          sourceField: 'json.content'
        },
        files: {
          'bin/<%= pkg.name %>.js': 'bin/<%= pkg.name %>.js'
        }
      }
    },

    delta: {
      options: {
        livereload: true
      },

      gruntfile: {
        files: 'gruntfile.js',
        tasks: [ 'jshint:gruntfile' ],
        options: {
          livereload: false
        }
      },

      jssrc: {
        files: ['src/**/*.js'],
        tasks: ['jshint:src', 'copy:build_js', 'ngmin', 'concat', 'http']
      },

      tpls: {
        files: ['src/**/*.tpl.html'],
        tasks: ['html2js', 'ngmin', 'concat', 'http']
      },
    },
    

    clean: ['build']
  });
  grunt.renameTask('watch','delta');
  grunt.registerTask('watch', ['build', 'delta']);
  grunt.registerTask('build', ['clean', 'copy:build_js', 'html2js', 'ngmin', 'concat', 'uglify', 'http']);
  grunt.registerTask('default', ['build']);
};