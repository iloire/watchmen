var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var main_bower_files = require('main-bower-files');

gulp.task('js', function () {
    return gulp.src('./webserver/public/js/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.uglify())
        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest('webserver/public/build'));
});

gulp.task('bower-js', function() {
    return gulp.src(main_bower_files())
        .pipe(plugins.filter('*.js'))
        .pipe(plugins.uglify())
        .pipe(plugins.concat('vendor.js'))
        .pipe(gulp.dest('webserver/public/build'));
});

gulp.task('bower-css', function() {
    return gulp.src(main_bower_files())
        .pipe(plugins.filter('*.css'))
        .pipe(plugins.minifyCss({keepBreaks:true}))
        .pipe(plugins.concat('vendor.css'))
        .pipe(gulp.dest('webserver/public/build'));
});

gulp.task('bower-fonts', function() {
    return gulp.src(main_bower_files())
        .pipe(plugins.filter('*.font'))
        .pipe(plugins.concat('vendor.css'))
        .pipe(gulp.dest('webserver/public/build'));
});


gulp.task('watch', function () {
    gulp.watch('./webserver/public/js/*', ['js', 'bower-js']);
});