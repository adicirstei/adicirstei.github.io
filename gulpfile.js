/*jslint node:true, sloppy: true */

var gulp = require('gulp'),
  jade = require('gulp-jade'),
  tap = require('gulp-tap'),
  path = require('path'),
  //stylus = require('gulp-stylus'),
  less = require('gulp-less'),
  gulpFilter = require('gulp-filter'),
  concat = require('gulp-concat'),
  cssmin = require('gulp-minify-css'),
  uglify = require('gulp-uglify'),
  meta = require('md-meta'),
  posts = [],
  marked = require('marked');


marked.setOptions({
  highlight: function (code, lang) {
    var hl = require('highlight.js');
    if (hl.getLanguage(lang)) {
      return hl.highlight(lang, code).value;
    } else {
      return hl.highlightAuto(code).value;
    }
  }
});

var buildBranch = require('./buildbranch');

gulp.task('default', ['build', 'buildbranch']);

gulp.task('styles', function () {

  var lessFilter = gulpFilter('*.less');
  
  return gulp.src(['src/styles/monokai.css', 'src/styles/normalize.css', 'src/styles/main.css', 'src/styles/*.less'])
    .pipe(lessFilter)
    .pipe(less({}))
    .pipe(lessFilter.restore())
    .pipe(concat('style.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('./www/styles'));
});

gulp.task('copy', function () {
  gulp.src('src/fonts/*')
    .pipe(gulp.dest('./www/fonts'));
  gulp.src('src/styles/*.css')
    .pipe(gulp.dest('./www/styles'));

  gulp.src('src/images/**/*')
    .pipe(gulp.dest('./www/images'));
  gulp.src('src/**/*.html')
    .pipe(gulp.dest('./www'));

});

gulp.task('scripts', function () {
  return gulp.src(['src/scripts/vendor/modernizr-2.7.1.min.js', 'src/scripts/vendor/jquery-2.1.0.js', 'src/scripts/vendor/helper.js', 'src/scripts/main.js'])
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./www/scripts'));
});

gulp.task('templates', function () {
  var YOUR_LOCALS = {
  };
    
  return gulp.src('src/posts/*.md')
    .pipe(tap(function (file, t) {
      var m = {summary:'', title:''}
      var filename = path.basename(file.path, '.md'),
        contents = file.contents.toString(),
        m = meta.extract(contents),
        title = m.title || filename,
        //title =  filename,
        newfile = filename;

      //title = title.replace(/^#*\s*/g, '').trim().replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
      file.contents = new Buffer("extends layout\nblock seo\n  title adicirstei/blog/" + title +
                                 "\n  meta(name='description', content='adicirstei home page and blog and;" 
                                 + m.summary.replace(/\r|\r\n|\n\r|\n/g, '').replace(/['"]/g, '') + "; "
                                 + title +
                                 "')\nblock content\n  article\n    include:md " + path.basename(file.path));
      newfile = title.replace(/(\s|[,.\-_])+/g, '-').toLowerCase();
      file.path = file.path.replace(filename, newfile);
      posts.push({content: contents, summary: m.summary, file: newfile + '.html', title: title, md: filename + '.md', date: filename.slice(0, 4) + '-' + filename.slice(4, 6) + '-' + filename.slice(6, 8)});

    }))
    .pipe(jade({
      locals: YOUR_LOCALS,
      md: marked
    }))
    .pipe(gulp.dest('./www/posts'));
});

gulp.task('posts', ['templates'], function () {
  var lastpost;
  posts.reverse();
  lastpost = posts[0];
  
  gulp.src('src/index.jade')
    .pipe(jade({
      md: marked,
      locals: {
        lastpost: marked(lastpost.content)
      }
    }))
    .pipe(gulp.dest('./www'));

  gulp.src('src/posts/index.jade')
    .pipe(jade({
      locals: {
        posts: posts
      },
      md: marked
    }))
    .pipe(gulp.dest('./www/posts'))
    .pipe(tap(function (file) {
      file.contents = new Buffer(JSON.stringify({posts: posts}));
      file.path = './www/data/posts.json';
    }))
//    .pipe(rename("posts.json"))
    .pipe(gulp.dest('./www/data'));
});

gulp.task('build', ['posts', 'copy', 'scripts', 'styles']);


gulp.task('buildbranch', function (cb) {
  
  buildBranch({
    branch: 'master',
    ignore: ['.git', 'www', 'node_modules'],
    folder: 'www',
    cwd: '.'
  }, function (err) {
    if (err) {
      throw err;
    }
    console.log('Published!');
    if (cb) {
      cb();
    }
  });

});