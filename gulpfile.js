var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var watch = require('gulp-watch');

gulp.task('js', function () {
    return gulp.src('./webserver/public/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(uglify())
        .pipe(concat('app.js'))
        .pipe(gulp.dest('webserver/public/build'));
});

gulp.task('watch', function () {
    gulp.watch('./webserver/public/*/*', ['js']);
});