/*! Only.js (Only Javascript in HTML - Conditional JavaScript dependency loader & manager)
 v2.0.1 (c) Harrison Emmanuel (2016-05-22)
 MIT License
 ------------------------------------------
 Built on LAB.js v2.0.3 (c) Kyle Simpson
 */

(function(global){
    "use strict";

    // cache current $O - used to rollback $O in noConflict()
    var _$O = global.$O,

        // constants that keep Only.js lightweight
        _js = "js",
        _wait = "wait",
        _text = "text",
        _type = "type",
        _charset = "charset",
        _elem = "elem",
        _head = "head",
        _exec = "exec",
        _push = "push",
        _exec_trigger = _exec + "_trigger",
        _on = "on",
        _load = "load",
        _onload = _on + _load,
        _preload = "pre" + _load,
        _onpreload = _on + _preload,
        _loaded = _load + "ed",
        _className = "className",
        _doScroll = "doScroll",
        _document = "document",
        _Element = "Element",
        _documentElement = _document + _Element,
        _finished = "finished",
        _finished_listeners = _finished + "_listeners",
        _createElement = "create" + _Element,
        _frameElement = "frame" + _Element,
        _insertBefore = "insertBefore",
        _charAt = "charAt",
        _call = "call",
        _callee = _call+"ee",
        _splice = "splice",
        _slice = "slice",
        _script = "script",
        _scripts = _script+"s",
        _console = "console",
        _log = "log",
        _end = "end",
        _setOptions = "setOptions",
        _test = "test",
        _src = "src",
        _real_src = "real_" + _src,
        _error = "error",
        _toString = "toString",
        _prototype = "prototype",
        _ready = "ready",
        _readyState = _ready + "State",
        _length = "length",
        _querySelector = "querySelector",
        _complete = "complete",
        _ready_listeners = _ready + "_listeners",
        _attributes = "attributes",
        _Event = "Event",
        _attachEvent = "attach" + _Event,
        _detachEvent = "detach" + _Event,
        _setAttribute = "setAttribute",
        _readystatechange = _ready + "statechange",
        _onreadystatechange = _on + _readystatechange,
        _Listener = "Listener",
        _addEvent = "add" + _Event,
        _addEventListener = _addEvent + _Listener,
        _removeEventListener = "remove" + _Event + _Listener,
        _DOMContentLoaded = "DOMContentLoaded",

        // extra lightweight variables
        _l = location,

        // constants for the valid keys of the options object
        _useLocalXHR = "useLocalXHR",
        _alwaysPreserveOrder = "alwaysPreserveOrder",
        _allowDuplicates = "allowDuplicates",
        _cacheBust = "cacheBust",
        /*!START_DEBUG*/_debug = "debug",/*!END_DEBUG*/
        _basePath = "basePath",
        _autoPolyfill = "autoPolyfill",

        // stateless variables used across all $O instances
        root_page = /^[^?#]*\//[_exec](_l.href)[0],
        root_domain = /^[\w|\-]+\:\/\/\/?[^\/]+/[_exec](root_page)[0],
        append_to = global[_document][_head] || global[_document].getElementsByTagName(_head)[0], // added [0]

        // inferences... ick, but still necessary
        opera_or_gecko = (global.opera && Object[_prototype][_toString][_call](global.opera) == "[object Opera]") || ("MozAppearance" in global[_document][_documentElement].style),

    // console.log() and console.error() wrappers
    /*!START_DEBUG*/log_msg = function(){}, log_error = log_msg,/*!END_DEBUG*/

    // feature sniffs (yay!)
        test_script_elem = global[_document][_createElement](_script),
        explicit_preloading = typeof test_script_elem[_preload] == "boolean", // http://wiki.whatwg.org/wiki/Script_Execution_Control#Proposal_1_.28Nicholas_Zakas.29
        real_preloading = explicit_preloading || (test_script_elem[_readyState] && test_script_elem[_readyState] == "uninitialized"), // will a script preload with `src` set before DOM append?
        script_ordered_async = !real_preloading && test_script_elem.async === true, // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order

    // XHR preloading (same-domain) and cache-preloading (remote-domain) are the fallbacks (for some browsers)
        xhr_or_cache_preloading = !real_preloading && !script_ordered_async && !opera_or_gecko
        ;

    // define console wrapper functions if applicable
    /*!START_DEBUG*/if (global[_console] && global[_console][_log]) {if (!global[_console][_error]) global[_console][_error] = global[_console][_log]; log_msg = function(msg) { global[_console][_log](msg); }; log_error = function(msg,err) { global[_console][_error](msg,err); };}/*!END_DEBUG*/

    /**
     * contentloaded.js by Diego Perini  & Julien Schmidt
     * adjusted for Only.js by Harrison Emmanuel
     *
     @function contentLoaded provides a cross-browser wrapper for DOMContentLoaded
     @param {Object} win - window reference
     @param {Function} fn - function to be called
     */
    function contentLoaded(win, fn) {
        var done = false,

            doc    = win[_document],
            root   = doc[_documentElement],
            modern = doc[_addEventListener],

            add = modern ? _addEventListener : _attachEvent,
            rem = modern ? _removeEventListener : _detachEvent,
            pre = modern ? '' : _on,

            init = function(e) {
                if (e[_type] === _readystatechange && doc[_readyState] !== _complete) return;

                (e[_type] === _load ? win : doc)[rem](pre + e[_type], init, false);

                if (!done && (done = true)) fn.call(win, e[_type] || e);
            },

            poll = function() {
                try {
                    root[_doScroll]('left');
                } catch(e) {
                    setTimeout(poll, 50);
                    return;
                }
                init('poll');
            };

        if (doc[_readyState] === _complete)
            fn.call(win, 'lazy');
        else {
            if (!modern && root[_doScroll])
                try {
                    if (!win[_frameElement]) poll();
                } catch(e) {}

            doc[add](pre + _DOMContentLoaded, init, false);
            doc[add](pre + _readystatechange, init, false);
            win[add](pre + _load, init, false);
        }
    }

    // test for function
    function is_func(func) { return Object[_prototype][_toString][_call](func) == "[object Function]"; }

    // test for array
    function is_array(arr) { return Object[_prototype][_toString][_call](arr) == "[object Array]"; }

    // make script URL absolute/canonical
    function canonical_uri(src,base_path) {
        var absolute_regex = /^\w+\:\/\//;

        // is `src` is protocol-relative (begins with // or ///), prepend protocol
        if (/^\/\/\/?/[_test](src))
            src = _l.protocol + src;

        // is `src` page-relative? (not an absolute URL, and not a domain-relative path, beginning with /)
        else if (!absolute_regex[_test](src) && src[_charAt](0) != "/")
            src = (base_path || "") + src; // prepend `base_path`, if any

        // make sure to return `src` as absolute
        return absolute_regex[_test](src) ? src : ((src[_charAt](0) == "/" ? root_domain : root_page) + src);
    }

    // merge `source` into `target`
    function merge_objs(source,target) {
        for (var k in source)
            if (source.hasOwnProperty(k))
                target[k] = source[k]; // TODO: does this need to be recursive for our purposes?

        return target;
    }

    // does the chain group have any ready-to-execute scripts?
    function check_chain_group_scripts_ready(chain_group) {
        var any_scripts_ready = false;
        for (var i=0; i<chain_group[_scripts][_length]; i++)
            if (chain_group[_scripts][i][_ready] && chain_group[_scripts][i][_exec_trigger]) {
                any_scripts_ready = true;
                chain_group[_scripts][i][_exec_trigger]();
                chain_group[_scripts][i][_exec_trigger] = null;
            }

        return any_scripts_ready;
    }

    // creates a script load listener
    function create_script_load_listener(elem,registry_item,flag,onload) {
        elem[_onload] = elem[_onreadystatechange] = function() {
            if ((elem[_readyState] && elem[_readyState] != _complete && elem[_readyState] != _loaded) || registry_item[flag]) return;
            elem[_onload] = elem[_onreadystatechange] = null;
            onload();
        };
    }

    // script executed handler
    function script_executed(registry_item) {
        registry_item[_ready] = registry_item[_finished] = true;
        for (var i=0; i<registry_item[_finished_listeners][_length]; i++)
            registry_item[_finished_listeners][i]();

        registry_item[_ready_listeners] = [];
        registry_item[_finished_listeners] = [];
    }

    // make the request for a script
    function request_script(chain_opts,script_obj,registry_item,onload,preload_this_script) {
        // setTimeout() "yielding" prevents some weird race/crash conditions in older browsers
        setTimeout(function(){
            var script, src = script_obj[_real_src], xhr;

            // don't proceed until `append_to` is ready to append to
            if ("item" in append_to) { // check if `append_to` ref is still a live node list
                if (!append_to[0]) { // `append_to` node not yet ready
                    // try again in a little bit -- note: will re-call the anonymous function in the outer setTimeout, not the parent `request_script()`
                    setTimeout(arguments[_callee],25);
                    return;
                }
                // reassign from live node list ref to pure node ref -- avoids nasty IE bug where changes to DOM invalidate live node lists
                append_to = append_to[0];
            }
            script = global[_document][_createElement](_script);
            if (script_obj[_type]) script[_type] = script_obj[_type];
            if (script_obj[_charset]) script[_charset] = script_obj[_charset];
            if (_attributes in script_obj)
                for (var key in script_obj[_attributes])
                    if (script_obj[_attributes].hasOwnProperty(key))
                        script[_setAttribute](key, script_obj[_attributes][key]);

            // should preloading be used for this script?
            if (preload_this_script) {
                // real script preloading?
                if (real_preloading) {
                    /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("start script preload: "+src);/*!END_DEBUG*/
                    registry_item[_elem] = script;
                    if (explicit_preloading) { // explicit preloading (aka, Zakas' proposal)
                        script[_preload] = true;
                        script[_onpreload] = onload;
                    }
                    else
                        script[_onreadystatechange] = function(){
                            if (script[_readyState] == _loaded) onload();
                        };

                    script[_src] = src;
                    // NOTE: no append to DOM yet, appending will happen when ready to execute
                }

                // same-domain and XHR allowed? use XHR preloading
                else if (preload_this_script && src.indexOf(root_domain) === 0 && chain_opts[_useLocalXHR]) {
                    xhr = new XMLHttpRequest(); // note: IE never uses XHR (it supports true preloading), so no more need for ActiveXObject fallback for IE <= 7
                    /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("start script preload (xhr): "+src);/*!END_DEBUG*/
                    xhr[_onreadystatechange] = function() {
                        if (xhr[_readyState] == 4) {
                            xhr[_onreadystatechange] = function(){}; // fix a memory leak in IE
                            registry_item[_text] = xhr.responseText + "\n//@ sourceURL=" + src; // http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
                            onload();
                        }
                    };
                    xhr.open("GET",src);
                    xhr.send();
                }

                // as a last resort, use cache-preloading
                else {
                    /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("start script preload (cache): "+src);/*!END_DEBUG*/
                    script[_type] = "text/cache-script";
                    create_script_load_listener(script,registry_item,_ready,function() {
                        append_to.removeChild(script);
                        onload();
                    });
                    script[_src] = src;
                    append_to[_insertBefore](script,null); // edit to insert js as last element
                }
            }
            // edited (else if - else) to (else - (if - else)) in LABjs for leaner code
            else {
                // use async=false for ordered async? parallel-load-serial-execute http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
                if (script_ordered_async) {
                    /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("start script load (ordered async): "+src);/*!END_DEBUG*/
                    script.async = false;
                    create_script_load_listener(script,registry_item,_finished,onload);
                }
                // otherwise, just a normal script element
                else {
                    /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("start script load: "+src);/*!END_DEBUG*/
                    create_script_load_listener(script,registry_item,_finished,onload);
                }
                script[_src] = src;
                append_to[_insertBefore](script,null); // edit to insert js as last element
            }
        },0);
    }

    // create a clean instance of $O
    function create_sandbox() {
        var global_defaults = {},
            can_use_preloading = real_preloading || xhr_or_cache_preloading,
            registry = {},
            instanceAPI,
            nullAPI
            ;

        // global defaults
        global_defaults[_useLocalXHR] = true;
        global_defaults[_alwaysPreserveOrder] = false;
        global_defaults[_allowDuplicates] = false;
        global_defaults[_cacheBust] = false;
        /*!START_DEBUG*/global_defaults[_debug] = false;/*!END_DEBUG*/
        global_defaults[_basePath] = "";
        global_defaults[_autoPolyfill] = false;

        // execute a script that has been preloaded already
        function execute_preloaded_script(chain_opts,script_obj,registry_item) {
            var script;

            function preload_execute_finished() {
                if (script !== null) { // make sure this only ever fires once
                    script = null;
                    script_executed(registry_item);
                }
            }

            if (registry[script_obj[_src]][_finished]) return;
            if (!chain_opts[_allowDuplicates]) registry[script_obj[_src]][_finished] = true;

            script = registry_item[_elem] || global[_document][_createElement](_script);
            if (script_obj[_type]) script[_type] = script_obj[_type];
            if (script_obj[_charset]) script[_charset] = script_obj[_charset];
            if (_attributes in script_obj)
                for (var key in script_obj[_attributes])
                    if (script_obj[_attributes].hasOwnProperty(key))
                        script[_setAttribute](key, script_obj[_attributes][key]);

            create_script_load_listener(script,registry_item,_finished,preload_execute_finished);

            // script elem was real-preloaded
            if (registry_item[_elem])
                registry_item[_elem] = null;
            // script was XHR preloaded
            else if (registry_item[_text]) {
                script[_onload] = script[_onreadystatechange] = null;	// script injection doesn't fire these events
                script[_text] = registry_item[_text];
            }
            // script was cache-preloaded
            else
                script[_src] = script_obj[_real_src];
            append_to[_insertBefore](script,null); // edit to insert js as last element

            // manually fire execution callback for injected scripts, since events don't fire
            if (registry_item[_text])
                preload_execute_finished();
        }

        // process the script request setup
        function do_script(chain_opts,script_obj,chain_group,preload_this_script) {
            var registry_item,
                registry_items,
                ready_cb = function(){ script_obj.ready_cb(script_obj,function(){ execute_preloaded_script(chain_opts,script_obj,registry_item); }); },
                finished_cb = function(){ script_obj.finished_cb(script_obj,chain_group); }
                ;

            script_obj[_src] = canonical_uri(script_obj[_src],chain_opts[_basePath]);
            script_obj[_real_src] = script_obj[_src] +
                    // append cache-bust param to URL?
                (chain_opts[_cacheBust] ? ((/\?.*$/[_test](script_obj[_src]) ? "&_" : "?_") + ~~(Math.random()*1E9) + "=") : "")
            ;

            if (!registry[script_obj[_src]]) registry[script_obj[_src]] = {items:[],finished:false};
            registry_items = registry[script_obj[_src]].items;

            // allowing duplicates, or is this the first recorded load of this script?
            if (chain_opts[_allowDuplicates] || registry_items[_length] === 0) {
                registry_item = registry_items[registry_items[_length]] = {
                    ready:false,
                    finished:false,
                    ready_listeners:[ready_cb],
                    finished_listeners:[finished_cb]
                };

                request_script(chain_opts,script_obj,registry_item,
                    // which callback type to pass?
                    (
                        (preload_this_script) ? // depends on script-preloading
                            function(){
                                registry_item[_ready] = true;
                                for (var i=0; i<registry_item[_ready_listeners][_length]; i++)
                                    registry_item[_ready_listeners][i]();

                                registry_item[_ready_listeners] = [];
                            } :
                            function(){ script_executed(registry_item); }
                    ),
                    // signal if script-preloading should be used or not
                    preload_this_script
                );
            }
            else {
                registry_item = registry_items[0];
                if (registry_item[_finished])
                    finished_cb();
                else
                    registry_item[_finished_listeners][_push](finished_cb);
            }
        }

        // creates a closure for each separate chain spawned from this $O instance, to keep state cleanly separated between chains
        function create_chain() {
            var chainedAPI,
                chain_opts = merge_objs(global_defaults,{}),
                chain = [],
                exec_cursor = 0,
                scripts_currently_loading = false,
                group
                ;

            // called when a script has finished preloading
            function chain_script_ready(script_obj,exec_trigger) {
                /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("script preload finished: "+script_obj[_real_src]);/*!END_DEBUG*/
                script_obj[_ready] = true;
                script_obj[_exec_trigger] = exec_trigger;
                advance_exec_cursor(); // will only check for 'ready' scripts to be executed
            }

            // called when a script has finished executing
            function chain_script_executed(script_obj,chain_group) {
                /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("script execution finished: "+script_obj[_real_src]);/*!END_DEBUG*/
                script_obj[_ready] = script_obj[_finished] = true;
                script_obj[_exec_trigger] = null;

                // check if chain group is all finished
                for (var i=0; i<chain_group[_scripts][_length]; i++)
                    if (!chain_group[_scripts][i][_finished]) return;

                // chain_group is all finished if we get this far
                chain_group[_finished] = true;
                advance_exec_cursor();
            }

            // main driver for executing each part of the chain
            function advance_exec_cursor() {
                while (exec_cursor < chain[_length]) {
                    if (is_func(chain[exec_cursor])) {
                        /*!START_DEBUG*/if (chain_opts[_debug]) log_msg("$O.wait() executing: "+chain[exec_cursor]);/*!END_DEBUG*/
                        try { chain[exec_cursor++](); } catch (err) {
                            /*!START_DEBUG*/if (chain_opts[_debug]) log_error("$O.wait() error caught: ",err);/*!END_DEBUG*/
                        }
                        continue;
                    }
                    else if (!chain[exec_cursor][_finished]) {
                        if (check_chain_group_scripts_ready(chain[exec_cursor])) continue;
                        break;
                    }
                    exec_cursor++;
                }

                // we've reached the end of the chain (so far)
                if (exec_cursor == chain[_length]) {
                    scripts_currently_loading = false;
                    group = false;
                }
            }

            // setup next chain script group
            function init_script_chain_group() {
                if (!group || !group[_scripts])
                    chain[_push](group = {scripts:[],finished:true});
            }

            // API for $O chains
            chainedAPI = {
                // Only.js edit: test for existence of element
                test:function (selector) {
                    if (!is_array(selector))
                        selector = [selector];

                    for (var j=0; j<selector[_length]; j++) {
                        if (global[_document][_querySelector](selector[j]) === null)
                            return nullAPI;
                    }

                    return chainedAPI;
                },
                // start loading one or more scripts
                js:function(){
                    (function(args){
                        for (var i=0; i<args[_length]; i++) {
                            var splice_args,
                                script_obj = args[i],
                                script_list = script_obj;

                            if (!is_array(script_obj))
                                script_list = [script_obj];
                            for (var j=0; j<script_list[_length]; j++) {
                                init_script_chain_group();
                                script_obj = script_list[j];

                                if (is_func(script_obj)) script_obj = script_obj();
                                if (!script_obj) continue;
                                if (is_array(script_obj)) {
                                    // set up an array of arguments to pass to splice()
                                    splice_args = [][_slice][_call](script_obj); // first include the actual array elements we want to splice in
                                    splice_args.unshift(j,1); // next, put the `index` and `howMany` parameters onto the beginning of the splice-arguments array
                                    [][_splice].apply(script_list,splice_args); // use the splice-arguments array as arguments for splice()
                                    j--; // adjust `j` to account for the loop's subsequent `j++`, so that the next loop iteration uses the same `j` index value
                                    continue;
                                }
                                if (typeof script_obj == "string") script_obj = {src:script_obj};
                                script_obj = merge_objs(script_obj,{
                                    ready:false,
                                    ready_cb:chain_script_ready,
                                    finished:false,
                                    finished_cb:chain_script_executed
                                });
                                group[_finished] = false;
                                group[_scripts][_push](script_obj);

                                do_script(chain_opts,script_obj,group,(can_use_preloading && scripts_currently_loading));
                                scripts_currently_loading = true;

                                if (chain_opts[_alwaysPreserveOrder]) chainedAPI[_wait]();
                            }
                        }
                    })(arguments);

                    return chainedAPI;
                },
                // force Only.js to pause in execution at this point in the chain, until the execution thus far finishes, before proceeding
                wait:function(){
                    if (arguments[_length] > 0) {
                        for (var i=0; i<arguments[_length]; i++)
                            chain[_push](arguments[i]);

                        group = chain[chain[_length]-1];
                    }
                    else group = false;

                    advance_exec_cursor();

                    return chainedAPI;
                },
                // force Only.js to terminate current test chain without explicit call to wait() or test()
                // Eg: $O.test().js().end().js();
                end: function () {
                    return chainedAPI;
                }
            };

            // the first chain link API (includes setOptions only this first time)
            return {
                test:chainedAPI[_test],
                js:chainedAPI[_js],
                wait:chainedAPI[_wait],
                end:chainedAPI[_end],
                setOptions:function(opts){
                    merge_objs(opts,chain_opts);
                    return chainedAPI;
                }
            };
        }

        // API for each initial $O instance (before chaining starts)
        instanceAPI = {
            // main API functions
            setDefaults:function(opts){
                merge_objs(opts,global_defaults);

                // load polyfill service?
                if (global_defaults[_autoPolyfill])
                    instanceAPI[_js]("https://cdn.polyfill.io/v2/polyfill.min.js");
            },
            // function to run on DOMContentLoaded (does not depend on chain)
            ready: function (fn) {
                contentLoaded(global, fn);
            },
            setOptions:function(){
                return create_chain()[_setOptions].apply(null,arguments);
            },
            test:function(){
                return create_chain()[_test].apply(null,arguments);
            },
            js:function(){
                return create_chain()[_js].apply(null,arguments);
            },
            wait:function(){
                return create_chain()[_wait].apply(null,arguments);
            },
            // create a new instance of $O
            end:create_sandbox,
            // rollback `[global].$O` to what it was before this file was loaded, the return this current instance of $O
            noConflict:function(){
                global.$O = _$O;

                return instanceAPI;
            },
            // create another clean instance of $O
            sandbox:create_sandbox
        };

        // API for each initial $O test instance (before chaining starts) - used by instanceAPI.test() if test fails
        nullAPI = {
            test:function(){
                return nullAPI;
            },
            js:function(){
                return nullAPI;
            },
            wait:function(){
                return nullAPI;
            },
            end:instanceAPI[_end]
        };

        return instanceAPI;
    }

    /* load entry point js with a fresh instance of main object
     * inspired from: https://github.com/jrburke/requirejs
     */
    var dataOnly = global[_document][_querySelector]('[data-only]');
    if (!!dataOnly)
        create_sandbox()[_js](dataOnly.getAttribute("data-only"));

    // replace no-js class with js on html element
    (function (el) {
        el[_className] = el[_className].replace('no-'+_js, _js);
    })(global[_document][_documentElement]);

    /* The following "hack" was suggested by Andrea Giammarchi and adapted from: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
     NOTE: this hack only operates in FF and then only in versions where document.readyState is not present (FF < 3.6?).

     The hack essentially "patches" the **page** that Only.js is loaded onto so that it has a proper conforming document.readyState, so that if a script which does
     proper and safe dom-ready detection is loaded onto a page, after dom-ready has passed, it will still be able to detect this state, by inspecting the now hacked
     document.readyState property. The loaded script in question can then immediately trigger any queued code executions that were waiting for the DOM to be ready.
     For instance, jQuery 1.4+ has been patched to take advantage of document.readyState, which is enabled by this hack. But 1.3.2 and before are **not** safe or
     fixed by this hack, and should therefore **not** be lazy-loaded by script loader tools such as Only.js.
     */
    (function(addEvent,domLoaded,handler){
        if (global[_document][_readyState] === null && global[_document][addEvent]){
            global[_document][_readyState] = "loading";
            global[_document][addEvent](domLoaded,handler = function(){
                global[_document][_removeEventListener](domLoaded,handler,false);
                global[_document][_readyState] = _complete;
            },false);
        }
    })(_addEventListener,_DOMContentLoaded);

    // create the main instance of $O
    global.$O = create_sandbox();
}( typeof global !== "undefined" ? global : (typeof exports !== "undefined" ? exports : this) )); // commonjs
