(function (win) {
    var _only = {
        pre_code: 'pre>code',
        base_path: win.location.hostname === 'localhost' ? '/projects/Only.js/gh-pages/assets/' : '/Only.js/assets/'
    };
    $O.setDefaults({
        basePath: _only.base_path
    });
    $O.js('js/CSS.load.min.js'); // load CSS.load to handle rel=preload hack and CSS loading
    $O.test(_only.pre_code).js('js/highlight.pack.js')
        .wait(function(){
            hljs.configure({tabReplace: true});
            Array.prototype.forEach.call(document.querySelectorAll(_only.pre_code), function(i) {
                hljs.highlightBlock(i);
            });
        });
})(window);
