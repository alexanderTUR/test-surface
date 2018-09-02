let gulp                = require('gulp'),
    sass                = require('gulp-sass'),
    postcss             = require("gulp-postcss"),
    mqpacker            = require("css-mqpacker"),
    csscomb             = require('postcss-csscomb'),
    cssprettify         = require('postcss-prettify'),
    browserSync         = require('browser-sync'),
    concat              = require('gulp-concat'),
    uglify              = require('gulp-uglify'),
    cleanCSS            = require('gulp-clean-css'),
    cleanhtml           = require('gulp-cleanhtml'),
    rename              = require('gulp-rename'),
    del                 = require('del'),
    cache               = require('gulp-cache'),
    autoprefixer        = require('gulp-autoprefixer'),
    rigger              = require('gulp-rigger'),
    sourcemaps          = require('gulp-sourcemaps'),
    notify              = require("gulp-notify"),
    svgSprite           = require('gulp-svg-sprite'),
    svgmin              = require('gulp-svgmin'),
    cheerio             = require('gulp-cheerio'),
    replace             = require('gulp-replace');

// Use this var for path to files
let path = 'app/';

// HTML task
gulp.task('html', function () {
	return gulp.src(path+'html/*.html')
		.pipe(rigger())
		.pipe(gulp.dest(path))
		.pipe(browserSync.reload({stream: true}));
});

// SASS task
gulp.task('sass', function() {
  let processors = [
    csscomb('zen'),
    mqpacker(),
    cssprettify()
  ];
  return gulp.src(path+'sass/**/*.sass')
    // .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
    .pipe(autoprefixer({
        browsers: ['>1%', 'not dead']
    }))
    .pipe(postcss(processors))
    // .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(path+'css'))
    .pipe(browserSync.stream());
});

// Js task
gulp.task('js', function() {
	return gulp.src([
		path+'js/libs/svg4everybody_2.1.9/svg4everybody.js',
		path+'js/common.js' // always the last
	])
		// .pipe(sourcemaps.init())
		.pipe(concat('scripts.min.js'))
		// .pipe(sourcemaps.write('/'))
		.pipe(gulp.dest(path+'js'))
		.pipe(browserSync.reload({stream: true}));
});

// SVG sprite task
gulp.task('svgSpriteBuild', function () {
	return gulp.src(path+'img/svg/*.svg')
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
				$('[class]').removeAttr('class');
				$('style').remove();
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: '../sprite/sprite.svg',
					render: {
						scss: {
							dest: '../../sass/helpers/_sprite.scss',
							template: path+'sass/helpers/_sprite_template.scss'
						}
					}
				}
			}
		}))
		.pipe(gulp.dest(path+'img'));
});

// Browser-sync task
gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: path
		},
		notify: false,
		open: false,
		browser: 'google chrome'
	});
});

// Watch task
gulp.task('watch', ['html', 'sass', 'js', 'svgSpriteBuild', 'browser-sync'], function() {
	gulp.watch(path+'html/**/*.html', ['html']);
	gulp.watch(path+'sass/**/*.sass', ['sass']);
	gulp.watch(path+'js/common.js', ['js']);
	gulp.watch(path+'img/svg/*.svg', ['svgSpriteBuild']);
	gulp.watch(path+'*.html', browserSync.reload);
});

// Build task
gulp.task('build', ['removebuild', 'svg', 'html', 'sass', 'js', 'svgSpriteBuild'], function() {

	var buildHtml = gulp.src([
		path+'*.html'
		])
		// .pipe(cleanhtml())
		.pipe(gulp.dest('build'));

	var buildCss = gulp.src([
		path+'css/main.css'
		])
		// .pipe(cleanCSS())
		.pipe(gulp.dest('build/css'));

	var buildJs = gulp.src([
		path+'js/scripts.min.js'
		])
		.pipe(uglify())
		.pipe(gulp.dest('build/js'));

	var buildFonts = gulp.src([
		path+'fonts/**/*'
		])
		.pipe(gulp.dest('build/fonts'));

	var buildImg = gulp.src([
		path+'img/**/*'
		])
		.pipe(gulp.dest('build/img'));

});

gulp.task('svg', ['svgSpriteBuild']);

gulp.task('removebuild', function() { return del.sync('build'); });
gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);