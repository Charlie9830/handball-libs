module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks
  grunt.loadNpmTasks('grunt-contrib-copy');


  grunt.initConfig({
    "babel": {
      options: {
        sourceMap: false,
        presets: ['@babel/preset-env'],
        // plugins: ['@babel/plugin-transform-async-to-generator','transform-object-rest-spread']
      },
      dist: {
        files: {
          "libs/pounder-dexie/index.js": "src/pounder-dexie/index.js",
          "libs/pounder-firebase/index.js": "src/pounder-firebase/index.js",
          "libs/pounder-firebase/paths/index.js": "src/pounder-firebase/paths/index.js",
          "libs/pounder-firebase/jobTypes/index.js": "src/pounder-firebase/jobTypes/index.js",
          "libs/pounder-redux/action-creators/index.js": "src/pounder-redux/action-creators/index.js",
          "libs/pounder-redux/action-types/index.js": "src/pounder-redux/action-types/index.js",
          "libs/pounder-redux/reducers/index.js": "src/pounder-redux/reducers/index.js",
          "libs/pounder-redux/index.js": "src/pounder-redux/index.js",
          "libs/pounder-stores/index.js": "src/pounder-stores/index.js",
          "libs/pounder-utilities/index.js": "src/pounder-utilities/index.js",
          "libs/firestore-batch-paginator/index.js": "src/firestore-batch-paginator/index.js",
          "libs/pounder-themes/index.js": "src/pounder-themes/index.js",
        }
      }
    },
    "copy": {
      "themes": {
        files: [
          { expand: true, flatten: true, cwd: './', src: ['./src/pounder-themes/*.json'], dest: './libs/pounder-themes/', filter: 'isFile'},
        ],
      }
    }
  });

  grunt.registerTask("build", ['copy', 'babel']);
}