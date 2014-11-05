/* jshint strict: true, unused: false */
(function(w){
    "use strict";
    
    var hasOwnProperty = Object.prototype.hasOwnProperty,
    
        /**
         *  Determines whether an object has a specific property (key).
         *  
         *  @param {object}   obj Object in question.
         *  @param {string}   key Key to check within given object.
         *  @return {boolean} Whether object has a specific property.
         */
        has = function(obj,key) {
            return obj != null && hasOwnProperty.call(obj, key);
        },
        
        /**
         *  Extend a given object with all the properties in passed-in object(s).
         *  
         *  @param {object}  obj Object to be extended.
         *  @param {object}  obj Object to be added.
         *  @param {object}  obj Optional. Object to be added.
         *  @param {object}  obj Optional. Object to be added.
         *  
         *  @return {object} obj Extended object.
         */
        extend = function(obj) {
            if (!isObject(obj)) {
                return obj;
            }
            var source, prop;
            for (var i = 1, length = arguments.length; i < length; i++) {
                source = arguments[i];
                for (prop in source) {
                    if (hasOwnProperty.call(source, prop)) {
                        obj[prop] = source[prop];
                    }
                }
            }
            return obj;
        },
        
        isObject = function(obj) {
            var type = typeof obj;
            return type === 'function' || type === 'object' && !!obj;
        },
        
        isFunction = function(f) {
            if ( 'function' === typeof(f) ) {
                return true;
            }
            return false;
        },
        
        // Built-in scripts' CDN
        scripts = {
            headjs: {
                src: '//cdnjs.cloudflare.com/ajax/libs/headjs/1.0.3/head.load.min.js',
                exists: 'head',
            },
            spservices: {
                src: '//cdnjs.cloudflare.com/ajax/libs/jquery.SPServices/2014.01/jquery.SPServices.min.js',
                exists: 'SPServices',
                dependentVar: 'jQuery',
            },
            jquery: {
                src: '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js',
                exists: 'jQuery',
            }
        },
    
        /**
         *  Injects a script into the head or the body with a callback option.
         *  
         *  @param {string} name Name or handle of the script.
         *  @param {object} args src, method, inHead, callback
         */
        Inject = function(name, args) {
            
            // Shortcut has function for checking args parameters
            var defaults = {
                    // Source of the external JavaScript or CSS file
                    src: '',
                    
                    // Available Methods:
                    method: this.js,
                    
                    // Variable to check to determine whether script has been loaded already
                    exists: '',
                    
                    // Location of injection
                    inHead: true,
                    
                    // Callback on script load
                    callback: null,
                    
                    // Variable to check if exists before loading
                    dependentVar: '',
                    
                    // Future Use
                    dependency: null
                },
                
                /**
                 *  Determines whether Inject's args contains a specific property.
                 *  
                 *  @param {string} k Key to check within args & defaults.
                 *  @return {boolean} Whether args has a specific property.
                 */
                argsHasProp = function(k) {
                    return has(args,k);
                },
                
                /**
                 *  Sets the Inject property to the value of given args or defaults.
                 *  
                 *  @param {string} Key to check within args & defaults.                 
                 */
                setProperty = function(k) {
                    if ( 'method' === k ) {
                        Inject[k] = Inject[k];
                    }
                    if ( argsHasProp(k) && isFunction(Inject[args[k]]) ) {
                        Inject[k] = Inject[args[k]];
                    } else {
                        Inject[k] = defaults[k];
                    }
                    
                };
            
            // Require the name parameter
            if ( 'undefined' === name ) {
                // @todo Throw exception/error
                return;
            }
            
            // Typeset args if undefined
            if ( 'undefined' === args ) {
                args = {};
            }
            
            // Set script name
            this.name = name.toLowerCase();
            
            // Set built-in scripts
            for (var script in scripts) {
                if (scripts.hasOwnProperty(script)){
                    scripts[script] = extend({},defaults,scripts[script]);
                }
            }
            
            // Prepare object
            for (var property in defaults) {
                if (defaults.hasOwnProperty(property)){
                    setProperty(property);
                }
            }
            
            // Maybe use built-in script
            if ( has(scripts, this.name) ) {
                if ( !this.src ) {
                    this.src = scripts[this.name].src;
                    if ( has(scripts[this.name], 'dependentVar') ) {
                        if ( !this._exists(scripts[this.name].dependentVar) && has(scripts[scripts[this.name].dependentVar.toLowerCase()],'src') ) {
                            this.dependency = new Inject(scripts[this.name].dependentVar);
                        }
                    }
                }
                
                extend(this,scripts[this.name],args);
                
            }
            
            // Let's go!
            if ( !this._exists(this.exists) && isFunction( this.method ) ) {
                this.method.call(this);
            }
        };
    
    /**
     *  Actually injects the script tag into the DOM.
     *  
     *  @param {object} s Script object to be placed into the DOM.
     */
    Inject.prototype.inject = function(s) {
        if ( 'undefined' === typeof this.inHead || 'undefined' !== typeof this.inHead && this.inHead ) {
            document.getElementsByTagName('head')[0].appendChild(s);
        } else {
            document.body.appendChild(s);
        }
    };
    
    /**
     *  Prepares script element to be injected into the DOM.
     */
    Inject.prototype.js = function() {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = this.src;
        if ( isFunction(this.callback) ) {
            s.onload = this.callback;
        }
        this.inject(s);
    };
    
    /**
     *  Prepares link element to be injected into the DOM.
     */
    Inject.prototype.css = function() {
        var l = document.createElement('link');
        l.type = 'text/css';
        l.href = this.src;
        this.inject(l);
    };
    
    /**
     *  Prepares inline script element to be injected into the DOM.
     */
    Inject.prototype.inlineJS = function(inline,callback) {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.innerText = inline;
        s.onload = callback;
        this.inject(s,1);
    };
    
    /**
     *  Determines whether a dependent variable/function name exists.
     *  
     *  @param  {string} dependentVar Dependent variable/function name to be checked.
     *  @return {boolean}           Whether the dependency exists.
     */
    Inject.prototype._exists = function(test) {
        if ( 'SPServices' === typeof test ) {
            if ( 'undefined' === typeof jQuery ) {
                return false;
            }
            if ( $().SPServices ) {
                return false;
            }
            return true;
        }
        if ( 'undefined' === typeof w[test] ) {
            return false;
        }
        return true;
    };
    
    w.iInject = Inject;
})(window);
