module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

  grunt.initConfig({
    "babel": {
      options: {
        sourceMap: false,
        presets: ['env'],
        plugins: ['transform-object-rest-spread']
      },
      dist: {
        files: {
          "libs/pounder-dexie/index.js": "src/pounder-dexie/index.js",
          "libs/pounder-firebase/index.js": "src/pounder-firebase/index.js",
          "libs/pounder-firebase/paths/index.js": "src/pounder-firebase/paths/index.js",
          "libs/pounder-redux/action-creators/index.js": "src/pounder-redux/action-creators/index.js",
          "libs/pounder-redux/action-types/index.js": "src/pounder-redux/action-types/index.js",
          "libs/pounder-redux/reducers/index.js": "src/pounder-redux/reducers/index.js",
          "libs/pounder-redux/index.js": "src/pounder-redux/index.js",
          "libs/pounder-stores/index.js": "src/pounder-stores/index.js",
          "libs/pounder-utilities/index.js": "src/pounder-utilities/index.js"
        }
      }
    }
  });

  grunt.registerTask("build", ["babel"]);
}