/*!
 * madphybrid v0.0.1
 * (c) 2019-2020 pactera
 * Released under the BSD-3-Clause License.
 *
 */

(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? (module.exports = factory())
        : typeof define === "function" && define.amd
        ? define(factory)
        : (global.madp = factory());
})(this, function () {
    "use strict";

    /**
     * 加入系统判断功能
     */
    function osMixin(hybrid) {
        const hybridJs = hybrid;
        const detect = function detect(ua) {
            this.os = {};

            const android = ua.match(/(Android);?[\s/]+([\d.]+)?/);

            if (android) {
                this.os.android = true;
                this.os.version = android[2];
                this.os.isBadAndroid = !/Chrome\/\d/.test(
                    window.navigator.appVersion
                );
            }

            const iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);

            if (iphone) {
                this.os.ios = true;
                this.os.iphone = true;
                this.os.version = iphone[2].replace(/_/g, ".");
            }

            const ipad = ua.match(/(iPad).*OS\s([\d_]+)/);

            if (ipad) {
                this.os.ios = true;
                this.os.ipad = true;
                this.os.version = ipad[2].replace(/_/g, ".");
            }

            // madphybrid的容器
            const madp = ua.match(/MadpHybrid/i);

            if (madp) {
                this.os.madp = true;
            }

            const dd = ua.match(/DingTalk/i);

            if (dd) {
                this.os.dd = true;
            }

            // 如果钉钉以及madp都不是，则默认为h5
            if (!dd && !madp) {
                this.os.h5 = true;
            }
        };
        detect.call(hybridJs, navigator.userAgent);
    }

    /**
     * 不用pollyfill，避免体积增大
     */
    function promiseMixin(hybrid) {
        const hybridJs = hybrid;

        hybridJs.Promise = window.Promise;

        hybridJs.getPromise = () => hybridJs.Promise;

        hybridJs.setPromise = (newPromise) => {
            hybridJs.Promise = newPromise;
        };
    }

    var globalError = {
        /**
         * 1001 api os错误
         */
        ERROR_TYPE_APIOS: {
            code: 1001,
            // 这个只是默认的提示，如果没有新的提示，就会采用默认的提示
            msg: "该API无法在当前OS下运行",
        },

        /**
         * 1002 api modify错误
         */
        ERROR_TYPE_APIMODIFY: {
            code: 1002,
            msg: "不允许更改JSSDK的API",
        },

        /**
         * 1003 module modify错误
         */
        ERROR_TYPE_MODULEMODIFY: {
            code: 1003,
            msg: "不允许更改JSSDK的模块",
        },

        /**
         * 1004 api 不存在
         */
        ERROR_TYPE_APINOTEXIST: {
            code: 1004,
            msg: "调用了不存在的api",
        },

        /**
         * 1005 组件api对应的proto不存在
         */
        ERROR_TYPE_PROTONOTEXIST: {
            code: 1005,
            msg: "调用错误，该组件api对应的proto不存在",
        },

        /**
         * 1006 非容器环境下无法调用自定义组件API
         */
        ERROR_TYPE_CUSTOMEAPINOTEXIST: {
            code: 1006,
            msg: "非容器下无法调用自定义组件API",
        },

        /**
         * 1007 对应的event事件在该环境下不存在
         */
        ERROR_TYPE_EVENTNOTEXIST: {
            code: 1007,
            msg: "对应的event事件在该环境下不存在",
        },

        /**
         * 1007 对应的event事件在该环境下不存在
         */
        ERROR_TYPE_INITVERSIONERROR: {
            code: 1008,
            msg: "初始化版本号错误，请检查容器api的实现情况",
        },

        /**
         * 2001 ready modify错误-ready回调正常只允许定义一个
         */
        ERROR_TYPE_READYMODIFY: {
            code: 2001,
            msg: "ready回调不允许多次设置",
        },

        /**
         * 2002 config modify错误-正常一个页面只允许config一次
         */
        ERROR_TYPE_CONFIGMODIFY: {
            code: 2002,
            msg: "config不允许多次调用",
        },

        /**
         * 2003 config 错误
         */
        ERROR_TYPE_CONFIGERROR: {
            code: 2003,
            msg: "config校验错误",
        },

        /**
         * 2004 version not support
         */
        ERROR_TYPE_VERSIONNOTSUPPORT: {
            code: 2004,
            msg: "不支持当前容器版本，请确保容器与前端库版本匹配",
        },

        /**
         * 2004 version not support
         */
        ERROR_TYPE_VERSIONNEEDUPGRADE: {
            code: 2005,
            msg: "当前JSSDK库小于容器版本，请将前端库升级到最新版本",
        },

        /**
         * 3000 原生错误(非API错误)，原生捕获到的错误都会通知J5
         */
        ERROR_TYPE_NATIVE: {
            code: 3000,
            msg: "捕获到一处原生容器错误",
        },

        /**
         * 3001 原生调用h5错误  原生通过JSBridge调用h5错误，可能是参数不对
         */
        ERROR_TYPE_NATIVECALL: {
            code: 3001,
            msg: "原生调用H5时参数不对",
        },

        /**
         * 9999 其它未知错误
         */
        ERROR_TYPE_UNKNOWN: {
            code: 9999,
            msg: "未知错误",
        },
    };

    function warn(msg) {
        // 模板字符串
        console.error(`[hybridJs error]: ${msg}`);
    }

    function log(msg) {
        console.log(`[hybridJs log]: ${msg}`);
    }

    function errorMixin(hybrid) {
        const hybridJs = hybrid;
        let errorFunc;

        /**
         * 提示全局错误
         * @param {Nunber} code 错误代码
         * @param {String} msg 错误提示
         */
        function showError(code = 0, msg = "错误!") {
            warn(`code:${code}, msg:${msg}`);
            errorFunc &&
                errorFunc({
                    code,
                    message: msg,
                });
        }

        hybridJs.showError = showError;

        hybridJs.globalError = globalError;

        /**
         * 当出现错误时，会通过这个函数回调给开发者，可以拿到里面的提示信息
         * @param {Function} callback 开发者设置的回调(每次会监听一个全局error函数)
         * 回调的参数好似
         * msg 错误信息
         * code 错误码
         */
        hybridJs.error = function error(callback) {
            errorFunc = callback;
        };
    }

    /**
     * 依赖于以下的基础库
     * Promise
     */
    function proxyMixin(hybrid) {
        const hybridJs = hybrid;

        /**
         * 对所有的API进行统一参数预处理，promise逻辑支持等操作
         * @param {Object} api 对应的API
         * @param {Function} callback 回调
         * @constructor
         */
        function Proxy(api, callback) {
            this.api = api;
            this.callback = callback;
        }

        /**
         * 实际的代理操作
         */
        Proxy.prototype.walk = function walk() {
            // 实时获取promise
            const Promise = hybridJs.getPromise();

            // 返回一个闭包函数
            return (...rest) => {
                let args = rest;

                args[0] = args[0] || {};

                // 默认参数的处理
                if (this.api.defaultParams && args[0] instanceof Object) {
                    Object.keys(this.api.defaultParams).forEach((item) => {
                        if (args[0][item] === undefined) {
                            args[0][item] = this.api.defaultParams[item];
                        }
                    });
                }

                // 决定是否使用Promise
                let finallyCallback;

                if (this.callback) {
                    // 将this指针修正为proxy内部，方便直接使用一些api关键参数
                    finallyCallback = this.callback;
                }

                if (Promise) {
                    return (
                        finallyCallback &&
                        new Promise((resolve, reject) => {
                            // 拓展 args
                            args = args.concat([resolve, reject]);
                            finallyCallback.apply(this, args);
                        })
                    );
                }

                return finallyCallback && finallyCallback.apply(this, args);
            };
        };

        /**
         * 析构函数
         */
        Proxy.prototype.dispose = function dispose() {
            this.api = null;
            this.callback = null;
        };

        hybridJs.Proxy = Proxy;
    }

    /**
     * h5和原生交互，jsbridge核心代码
     * 依赖于showError，globalError，os
     */
    function jsbridgeMixin(hybrid) {
        const hybridJs = hybrid;

        // 必须要有一个全局的JSBridge，否则原生和H5无法通信
        // 定义每次重新生成一个JSBridge
        window.JSBridge = {};

        const JSBridge = window.JSBridge;
        // 声明依赖
        const showError = hybridJs.showError;
        const globalError = hybridJs.globalError;
        const os = hybridJs.os;

        hybridJs.JSBridge = JSBridge;

        // jsbridge协议定义的名称
        const CUSTOM_PROTOCOL_SCHEME = "MadpHybridJSBridge";
        // 本地注册的方法集合,原生只能调用本地注册的方法,否则会提示错误
        const messageHandlers = {};
        // 短期回调函数集合
        // 在原生调用完对应的方法后,会执行对应的回调函数id，并删除
        const responseCallbacks = {};
        // 长期存在的回调，调用后不会删除
        const responseCallbacksLongTerm = {};

        // 唯一id,用来确保长期回调的唯一性，初始化为最大值
        let uniqueLongCallbackId = 2147483647;

        /**
         * 获取短期回调id，内部要避免和长期回调的冲突
         * @return {Number} 返回一个随机的短期回调id
         */
        function getCallbackId() {
            // 确保每次都不会和长期id相同
            return Math.floor(Math.random() * uniqueLongCallbackId);
        }

        /**
         * 将JSON参数转为字符串
         * @param {Object} data 对应的json对象
         * @return {String} 转为字符串后的结果
         */
        function getParam(data) {
            if (typeof data !== "string") {
                return JSON.stringify(data);
            }

            return data;
        }

        /**
         * 获取最终的url scheme
         * @param {String} proto 协议头，一般不同模块会有不同的协议头
         * @param {Object} message 兼容android中的做法
         * android中由于原生不能获取JS函数的返回值,所以得通过协议传输
         * @return {String} 返回拼接后的uri
         */
        function getUri(proto, message) {
            let uri = `${CUSTOM_PROTOCOL_SCHEME}://${proto}`;

            // 回调id作为端口存在
            let callbackId;
            let method;
            let params;

            if (message.callbackId) {
                // 必须有回调id才能生成一个scheme
                // 这种情况是H5主动调用native时
                callbackId = message.callbackId;
                method = message.handlerName;
                params = message.data;
            }

            // 参数转为字符串
            params = encodeURIComponent(getParam(params));
            // uri 补充,需要编码，防止非法字符
            uri += `:${callbackId}/${method}?${params}`;

            return uri;
        }

        /**
         * JS调用原生方法前,会先send到这里进行处理
         * @param {String} proto 这个属于协议头的一部分
         * @param {JSON} message 调用的方法详情,包括方法名,参数
         * @param {Object} responseCallback 调用完方法后的回调,或者长期回调的id
         */
        function doSend(proto, message, responseCallback) {
            const newMessage = message;

            if (typeof responseCallback === "function") {
                // 如果传入的回调时函数，需要给它生成id
                // 取到一个唯一的callbackid
                const callbackId = getCallbackId();
                // 回调函数添加到短期集合中
                responseCallbacks[callbackId] = responseCallback;
                // 方法的详情添加回调函数的关键标识
                newMessage.callbackId = callbackId;
            } else {
                // 如果传入时已经是id，代表已经在回调池中了，直接使用即可
                newMessage.callbackId = responseCallback;
            }

            // 获取 触发方法的url scheme
            const uri = getUri(proto, newMessage);

            if (os.madp) {
                // 依赖于os判断
                if (os.ios) {
                    // ios采用
                    window.webkit.messageHandlers.WKWebViewJavascriptBridge.postMessage(
                        uri
                    );
                } else {
                    window.top.prompt(uri, "");
                }
            } else {
                // 浏览器
                warn(`浏览器中jsbridge无效,对应scheme:${uri}`);
            }
        }

        /**
         * 注册本地JS方法通过JSBridge给原生调用
         * 我们规定,原生必须通过JSBridge来调用H5的方法
         * 注意,这里一般对本地函数有一些要求,要求第一个参数是data,第二个参数是callback
         * @param {String} handlerName 方法名
         * @param {Function} handler 对应的方法
         */
        JSBridge.registerHandler = function registerHandler(
            handlerName,
            handler
        ) {
            messageHandlers[handlerName] = handler;
        };

        /**
         * 注册长期回调到本地
         * @param {String} callbackId 回调id
         * @param {Function} callback 对应回调函数
         */
        JSBridge.registerLongCallback = function registerLongCallback(
            callbackId,
            callback
        ) {
            responseCallbacksLongTerm[callbackId] = callback;
        };

        /**
         * 获得本地的长期回调，每一次都是一个唯一的值
         * @retrurn 返回对应的回调id
         * @return {Number} 返回长期回调id
         */
        JSBridge.getLongCallbackId = function getLongCallbackId() {
            uniqueLongCallbackId -= 1;

            return uniqueLongCallbackId;
        };

        /**
         * 调用原生开放的方法
         * @param {String} proto 这个属于协议头的一部分
         * @param {String} handlerName 方法名
         * @param {JSON} data 参数
         * @param {Object} callback 回调函数或者是长期的回调id
         */
        JSBridge.callHandler = function callHandler(
            proto,
            handlerName,
            data,
            callback
        ) {
            doSend(
                proto,
                {
                    handlerName,
                    data,
                },
                callback
            );
        };

        /**
         * 原生调用H5页面注册的方法,或者调用回调方法
         * @param {String} messageJSON 对应的方法的详情,需要手动转为json
         */
        JSBridge._handleMessageFromNative = function _handleMessageFromNative(
            messageJSON
        ) {
            /**
             * 处理原生过来的方法
             */
            function doDispatchMessageFromNative() {
                let message;

                try {
                    if (typeof messageJSON === "string") {
                        message = decodeURIComponent(messageJSON);
                        message = JSON.parse(message);
                    } else {
                        message = messageJSON;
                    }
                } catch (e) {
                    showError(
                        globalError.ERROR_TYPE_NATIVECALL.code,
                        globalError.ERROR_TYPE_NATIVECALL.msg
                    );
                    return;
                }

                // 回调函数
                const responseId = message.responseId;
                const responseData = message.responseData;
                let responseCallback;

                if (responseId) {
                    // 这里规定,原生执行方法完毕后准备通知h5执行回调时,回调函数id是responseId
                    responseCallback = responseCallbacks[responseId];
                    // 默认先短期再长期
                    responseCallback =
                        responseCallback ||
                        responseCallbacksLongTerm[responseId];
                    // 执行本地的回调函数
                    responseCallback && responseCallback(responseData);

                    delete responseCallbacks[responseId];
                } else {
                    /**
                     * 否则,代表原生主动执行h5本地的函数
                     * 从本地注册的函数中获取
                     */
                    const handler = messageHandlers[message.handlerName];
                    const data = message.data;

                    // 执行本地函数,按照要求传入数据和回调
                    handler && handler(data);
                }
            }

            // 使用异步
            setTimeout(doDispatchMessageFromNative);
        };
    }

    function isObject(object) {
        const classType = Object.prototype.toString
            .call(object)
            .match(/^\[object\s(.*)\]$/)[1];
        return (
            classType !== "String" &&
            classType !== "Number" &&
            classType !== "Boolean" &&
            classType !== "Undefined" &&
            classType !== "Null"
        );
    }

    const noop = () => {};

    function extend(target, ...rest) {
        const finalTarget = target;

        rest.forEach((source) => {
            Object.keys(source).forEach((key) => {
                finalTarget[key] = source[key];
            });
        });

        return finalTarget;
    }

    /**
     * 如果version1大于version2，返回1，如果小于，返回-1，否则返回0。
     * @param {string} version1 版本1
     * @param {string} version2 版本2
     * @return {number} 返回版本1和版本2的关系
     */
    function compareVersion(version1, version2) {
        if (typeof version1 !== "string" || typeof version2 !== "string") {
            throw new Error("version need to be string type");
        }

        const verArr1 = version1.split(".");
        const verArr2 = version2.split(".");
        const len = Math.max(verArr1.length, verArr2.length);

        // forin不推荐，foreach不能return与break
        for (let i = 0; i < len; i += 1) {
            let ver1 = verArr1[i] || 0;
            let ver2 = verArr2[i] || 0;

            // 隐式转化为数字
            ver1 -= 0;
            ver2 -= 0;

            if (ver1 > ver2) {
                return 1;
            } else if (ver1 < ver2) {
                return -1;
            }
        }

        return 0;
    }

    /**
     * 字符串超出截取
     * @param {string} str 目标字符串
     * @param {Number} count 字数，以英文为基数，如果是中文，会自动除2
     * @return {string} 返回截取后的字符串
     * 暂时不考虑只遍历一部分的性能问题，因为在应用场景内是微不足道的
     */
    function eclipseText(str = "", count = 6) {
        const LEN_CHINESE = 2;
        const LEN_ENGLISH = 1;
        let num = 0;

        return str
            .split("")
            .filter((ch) => {
                num += /[\u4e00-\u9fa5]/.test(ch) ? LEN_CHINESE : LEN_ENGLISH;

                return num <= count;
            })
            .join("");
    }

    /**
     * 得到一个项目的根路径
     * h5模式下例如:http://id:端口/项目名/
     * @return {String} 项目的根路径
     */
    function getProjectBasePath() {
        const locObj = window.location;
        const patehName = locObj.pathname;
        const pathArray = patehName.split("/");
        // 如果是 host/xxx.html 则是/，如果是host/project/xxx.html,则是project/
        // pathName一般是 /context.html 或 /xxx/xx/content.html
        const hasProject = pathArray.length > 2;
        const contextPath = `${pathArray[Number(hasProject)]}/`;

        // 如果尾部有两个//替换成一个
        return `${locObj.protocol}//${locObj.host}/${contextPath}`.replace(
            /[/]{2}$/,
            "/"
        );
    }

    /**
     * 将相对路径转为绝对路径 ./ ../ 开头的  为相对路径
     * 会基于对应调用js的html路径去计算
     * @param {String} path 需要转换的路径
     * @return {String} 返回转换后的路径
     */
    function changeRelativePathToAbsolute(path) {
        const locObj = window.location;
        const patehName = locObj.pathname;
        // 匹配相对路径返回父级的个数
        const relatives = path.match(/\.\.\//g);
        const count = (relatives && relatives.length) || 0;
        // 将patehName拆为数组，然后计算当前的父路径，需要去掉相应相对路径的层级
        const pathArray = patehName.split("/");
        const parentPath = pathArray
            .slice(0, pathArray.length - (count + 1))
            .join("/");
        const childPath = path.replace(/\.+\//g, "");
        // 找到最后的路径， 通过正则 去除 ./ 之前的所有路径
        let finalPath = `${parentPath}/${childPath}`;

        finalPath = `${locObj.protocol}//${locObj.host}${finalPath}`;

        return finalPath;
    }

    /**
     * 得到一个全路径
     * @param {String} path 路径
     * @return {String} 返回最终的路径
     */
    function getFullPath(path) {
        // 全路径
        if (/^(http|https|ftp|\/\/)/g.test(path)) {
            return path;
        }

        // 是否是相对路径
        const isRelative = /(\.\/)|(\.\.\/)/.test(path);

        if (isRelative) {
            return changeRelativePathToAbsolute(path);
        }

        return `${getProjectBasePath()}${path}`;
    }

    /**
     * 将json参数拼接到url中
     * @param {String} url url地址
     * @param {Object} data 需要添加的json数据
     * @return {String} 返回最终的url
     */
    function getFullUrlByParams(url = "", data) {
        let fullUrl = getFullPath(url);
        let extrasDataStr = "";

        if (data) {
            Object.keys(data).forEach((item) => {
                if (
                    extrasDataStr.indexOf("?") === -1 &&
                    fullUrl.indexOf("?") === -1
                ) {
                    extrasDataStr += "?";
                } else {
                    extrasDataStr += "&";
                }
                extrasDataStr += `${item}=${data[item]}`;
            });
        }

        fullUrl += extrasDataStr;

        return fullUrl;
    }

    /**
     * 内部触发jsbridge的方式，作为一个工具类提供
     */
    function generateJSBridgeTrigger(JSBridge) {
        /**
         * 有三大类型，短期回调，延时回调，长期回调，其中长期回调中又有一个event比较特殊
         * @param {JSON} options 配置参数，包括
         * handlerName 方法名
         * data 额外参数
         * isLongCb 是否是长期回调，如果是，则会生成一个长期回调id，以长期回调的形式存在
         * proto 对应方法的模块名
         * 其它 代表相应的头部
         * @param {Function} resolve promise中成功回调函数
         * @param {Function} reject promise中失败回调函数
         */
        return function callJsBridge(options, resolve, reject) {
            const success = options.success;
            const error = options.error;
            const dataFilter = options.dataFilter;
            const proto = options.proto;
            const handlerName = options.handlerName;
            const isLongCb = options.isLongCb;
            const isEvent = options.isEvent;
            const data = options.data;

            // 统一的回调处理
            const cbFunc = (res) => {
                if (res.code === 0) {
                    error && error(res);
                    // 长期回调不走promise
                    !isLongCb && reject && reject(res);
                } else {
                    let finalRes = res;

                    if (dataFilter) {
                        finalRes = dataFilter(finalRes);
                    }
                    // 提取出result
                    success && success(finalRes.result);
                    !isLongCb && resolve && resolve(finalRes.result);
                }
            };

            if (isLongCb) {
                /**
                 * 长期回调的做法，需要注册一个长期回调id,每一个方法都有一个固定的长期回调id
                 * 短期回调的做法(短期回调执行一次后会自动销毁)
                 * 但长期回调不会销毁，因此可以持续触发，例如下拉刷新
                 * 长期回调id通过函数自动生成，每次会获取一个唯一的id
                 */
                const longCbId = JSBridge.getLongCallbackId();

                if (isEvent) {
                    // 如果是event，data里需要增加一个参数
                    data.port = longCbId;
                }
                JSBridge.registerLongCallback(longCbId, cbFunc);
                // 传入的是id
                JSBridge.callHandler(proto, handlerName, data, longCbId);
                // 长期回调默认就成功了，这是兼容的情况，防止有人误用
                resolve && resolve();
            } else {
                // 短期回调直接使用方法
                JSBridge.callHandler(proto, handlerName, data, cbFunc);
            }
        };
    }

    /**
     * 如果api没有runcode，应该有一个默认的实现
     */
    function callinnerMixin(hybrid) {
        const hybridJs = hybrid;
        const os = hybridJs.os;
        const JSBridge = hybridJs.JSBridge;
        const callJsBridge = generateJSBridgeTrigger(JSBridge);

        /**
         * 专门供API内部调用的，this指针被指向了proxy对象，方便处理
         * @param {Object} options 配置参数
         * @param {Function} resolve promise的成功回调
         * @param {Function} reject promise的失败回调
         */
        function callInner(options, resolve, reject) {
            const data = extend({}, options);

            // 纯数据不需要回调
            data.success = undefined;
            data.error = undefined;
            data.dataFilter = undefined;

            if (os.madp) {
                // 默认madp环境才触发jsbridge
                callJsBridge(
                    {
                        handlerName: this.api.namespace,
                        data,
                        proto: this.api.moduleName,
                        success: options.success,
                        error: options.error,
                        dataFilter: options.dataFilter,
                        isLongCb: this.api.isLongCb,
                        isEvent: this.api.isEvent,
                    },
                    resolve,
                    reject
                );
            }
        }

        hybridJs.callInner = callInner;
    }

    /**
     * 定义API的添加
     * 必须按照特定方法添加API才能正常的代理
     * 依赖于一些基本库
     * os
     * Proxy
     * globalError
     * showError
     * callInner
     */
    function defineapiMixin(hybrid) {
        const hybridJs = hybrid;
        const Proxy = hybridJs.Proxy;
        const globalError = hybridJs.globalError;
        const showError = hybridJs.showError;
        const os = hybridJs.os;
        const callInner = hybridJs.callInner;

        /**
         * 存放所有的代理 api对象
         * 每一个命名空间下的每一个os都可以执行
         * proxyapi[namespace][os]
         */
        const proxysApis = {};

        /**
         * 存放所有的代理 module对象
         */
        const proxysModules = {};

        const supportOsArray = ["madp", "dd", "h5"];

        function getCurrProxyApiOs(currOs) {
            for (let i = 0, len = supportOsArray.length; i < len; i += 1) {
                if (currOs[supportOsArray[i]]) {
                    return supportOsArray[i];
                }
            }

            // 默认是h5
            return "h5";
        }

        function getModuleApiParentByNameSpace(module, namespace) {
            let apiParent = module;
            // 只取命名空间的父级,如果仅仅是xxx，是没有父级的
            const parentNamespaceArray = /[.]/.test(namespace)
                ? namespace.replace(/[.][^.]+$/, "").split(".")
                : [];

            parentNamespaceArray.forEach((item) => {
                apiParent[item] = apiParent[item] || {};
                apiParent = apiParent[item];
            });

            return apiParent;
        }

        function proxyApiNamespace(apiParent, apiName, finalNameSpace, api) {
            // 代理API，将apiParent里的apiName代理到Proxy执行
            Object.defineProperty(apiParent, apiName, {
                configurable: true,
                enumerable: true,
                get: function proxyGetter() {
                    // 确保get得到的函数一定是能执行的
                    const nameSpaceApi = proxysApis[finalNameSpace];
                    // 得到当前是哪一个环境，获得对应环境下的代理对象
                    const proxyObj =
                        nameSpaceApi[getCurrProxyApiOs(os)] || nameSpaceApi.h5;

                    if (proxyObj) {
                        /**
                         * 返回代理对象，所以所有的api都会通过这个代理函数
                         * 注意引用问题，如果直接返回原型链式的函数对象，由于是在getter中，里面的this会被改写
                         * 所以需要通过walk后主动返回
                         */
                        return proxyObj.walk();
                    }

                    // 正常情况下走不到，除非预编译的时候在walk里手动抛出
                    const osErrorTips = api.os ? api.os.join("或") : '"非法"';
                    const msg = `${api.namespace}要求的os环境为:${osErrorTips}`;

                    showError(globalError.ERROR_TYPE_APIOS.code, msg);

                    return noop;
                },
                set: function proxySetter() {
                    showError(
                        globalError.ERROR_TYPE_APIMODIFY.code,
                        globalError.ERROR_TYPE_APIMODIFY.msg
                    );
                },
            });
        }

        /**
         * 监听模块，防止被篡改
         * @param {String} moduleName 模块名
         */
        function observeModule(moduleName) {
            Object.defineProperty(hybridJs, moduleName, {
                configurable: true,
                enumerable: true,
                get: function proxyGetter() {
                    if (!proxysModules[moduleName]) {
                        proxysModules[moduleName] = {};
                    }

                    return proxysModules[moduleName];
                },
                set: function proxySetter() {
                    showError(
                        globalError.ERROR_TYPE_MODULEMODIFY.code,
                        globalError.ERROR_TYPE_MODULEMODIFY.msg
                    );
                },
            });
        }

        /**
         * 在某一个模块下拓展一个API
         * @param {String} moduleName 模块名
         * @param {String} apiParam api对象,包含
         * namespace 命名空间
         * os 支持的环境
         * defaultParams 默认参数
         */
        function extendApi(moduleName, apiParam) {
            if (!apiParam || !apiParam.namespace) {
                return;
            }
            if (!hybridJs[moduleName]) {
                // 如果没有定义模块，监听整个模块，用代理取值，防止重定义
                // 这样，模块只允许初次定义以及之后的赋值，其它操作都会被内部拒绝
                observeModule(moduleName);
            }

            const api = apiParam;
            const modlue = hybridJs[moduleName];
            const apiNamespace = api.namespace;

            // api加上module关键字，方便内部处理
            api.moduleName = moduleName;

            const apiParent = getModuleApiParentByNameSpace(
                modlue,
                apiNamespace
            );

            // 最终的命名空间是包含模块的
            const finalNameSpace = `${moduleName}.${api.namespace}`;
            // 如果仅仅是xxx，直接取xxx，如果aa.bb，取bb
            const apiName = /[.]/.test(apiNamespace)
                ? api.namespace.match(/[.][^.]+$/)[0].substr(1)
                : apiNamespace;

            // 这里防止触发代理，就不用apiParent[apiName]了，而是用proxysApis[finalNameSpace]
            if (!proxysApis[finalNameSpace]) {
                // 如果还没有代理这个API的命名空间，代理之，只需要设置一次代理即可
                proxyApiNamespace(apiParent, apiName, finalNameSpace, api);
            }

            // 一个新的API代理，会替换以前API命名空间中对应的内容
            let apiRuncode = api.runCode;

            if (!apiRuncode && callInner) {
                // 如果没有runcode，默认使用callInner
                apiRuncode = callInner;
            }

            const newApiProxy = new Proxy(api, apiRuncode);
            const oldProxyNamespace = proxysApis[finalNameSpace] || {};
            const oldProxyOsNotUse = {};

            proxysApis[finalNameSpace] = {};

            supportOsArray.forEach((osTmp) => {
                if (api.os && api.os.indexOf(osTmp) !== -1) {
                    // 如果存在这个os，并且合法，重新定义
                    proxysApis[finalNameSpace][osTmp] = newApiProxy;
                    oldProxyOsNotUse[osTmp] = true;
                } else if (oldProxyNamespace[osTmp]) {
                    // 否则仍然使用老版本的代理
                    proxysApis[finalNameSpace][osTmp] =
                        oldProxyNamespace[osTmp];
                    // api本身的os要添加这个环境，便于提示
                    api.os && api.os.push(osTmp);
                }
            });

            Object.keys(oldProxyOsNotUse).forEach((notUseOs) => {
                // 析构不用的代理
                oldProxyNamespace[notUseOs] &&
                    oldProxyNamespace[notUseOs].dispose();
            });
        }

        /**
         * 拓展整个对象的模块
         * @param {String} moduleName 模块名
         * @param {Array} apis 对应的api数组
         */
        function extendModule(moduleName, apis) {
            if (!apis || !Array.isArray(apis)) {
                return;
            }
            if (!hybridJs[moduleName]) {
                // 如果没有定义模块，监听整个模块，用代理取值，防止重定义
                // 这样，模块只允许初次定义以及之后的赋值，其它操作都会被内部拒绝
                observeModule(moduleName);
            }
            for (let i = 0, len = apis.length; i < len; i += 1) {
                extendApi(moduleName, apis[i]);
            }
        }

        hybridJs.extendModule = extendModule;
        hybridJs.extendApi = extendApi;
    }

    /**
     * 定义如何调用一个API
     * 一般指调用原生环境下的API
     * 依赖于Promise,calljsbridgeMixin
     */
    function callnativeapiMixin(hybrid) {
        const hybridJs = hybrid;
        const JSBridge = hybridJs.JSBridge;
        const callJsBridge = generateJSBridgeTrigger(JSBridge);

        /**
         * 调用自定义API
         * @param {Object} options 配置参数
         * @return {Object} 返回一个Promise对象，如果没有Promise环境，直接返回运行结果
         */
        function callApi(options) {
            // 实时获取promise
            const Promise = hybridJs.getPromise();
            const finalOptions = options || {};

            const callback = (resolve, reject) => {
                callJsBridge(
                    {
                        handlerName: finalOptions.name,
                        proto: finalOptions.mudule,
                        data: finalOptions.data || {},
                        success: finalOptions.success,
                        error: finalOptions.error,
                        isLongCb: finalOptions.isLongCb,
                        isEvent: finalOptions.isEvent,
                    },
                    resolve,
                    reject
                );
            };

            return (Promise && new Promise(callback)) || callback();
        }

        hybridJs.callApi = callApi;
        hybridJs.callNativeApi = callApi;
    }

    /**
     * 初始化给配置全局函数
     */
    function initMixin(hybrid) {
        const hybridJs = hybrid;
        const globalError = hybridJs.globalError;
        const showError = hybridJs.showError;
        const JSBridge = hybridJs.JSBridge;

        /**
         * 几个全局变量 用来控制全局的config与ready逻辑
         * 默认ready是false的
         */
        let readyFunc;
        let isAllowReady = false;
        let isConfig = false;

        /**
         * 检查环境是否合法，包括
         * 检测是否有检测版本号，如果不是，给出错误提示
         * 是否版本号小于容器版本号，如果小于，给予升级提示
         */
        function checkEnvAndPrompt() {
            if (!hybridJs.runtime || !hybridJs.runtime.getMadpVersion) {
                showError(
                    globalError.ERROR_TYPE_VERSIONNOTSUPPORT.code,
                    globalError.ERROR_TYPE_VERSIONNOTSUPPORT.msg
                );
            } else {
                hybridJs.runtime.getMadpVersion({
                    success: (result) => {
                        const version = result.version;

                        if (compareVersion(hybridJs.version, version) < 0) {
                            showError(
                                globalError.ERROR_TYPE_VERSIONNEEDUPGRADE.code,
                                globalError.ERROR_TYPE_VERSIONNEEDUPGRADE.msg
                            );
                        }
                    },
                    error: () => {
                        showError(
                            globalError.ERROR_TYPE_INITVERSIONERROR.code,
                            globalError.ERROR_TYPE_INITVERSIONERROR.msg
                        );
                    },
                });
            }
        }

        /**
         * 页面初始化时必须要这个config函数
         * 必须先声明ready，然后再config
         * @param {Object} params
         * config的jsApiList主要是同来通知给原生进行注册的
         * 所以这个接口到时候需要向原生容器请求的
         */
        hybridJs.config = function config(params) {
            if (isConfig) {
                showError(
                    globalError.ERROR_TYPE_CONFIGMODIFY.code,
                    globalError.ERROR_TYPE_CONFIGMODIFY.msg
                );
            } else {
                isConfig = true;

                const success = () => {
                    // 如果这时候有ready回调
                    if (readyFunc) {
                        log("ready!");
                        readyFunc();
                    } else {
                        // 允许ready直接执行
                        isAllowReady = true;
                    }
                };

                if (hybridJs.os.madp) {
                    // 暂时检查环境默认就进行，因为框架默认注册了基本api的，并且这样2.也可以给予相应提示
                    checkEnvAndPrompt();

                    hybridJs.auth.config(
                        extend(
                            {
                                success() {
                                    success();
                                },
                                error(error) {
                                    const tips = JSON.stringify(error);

                                    showError(
                                        globalError.ERROR_TYPE_CONFIGERROR.code,
                                        tips
                                    );
                                },
                            },
                            params || {}
                        )
                    );
                } else {
                    success();
                }
            }
        };

        /**
         * 初始化完毕，并且config验证完毕后会触发这个回调
         * 注意，只有config了，才会触发ready，否则无法触发
         * ready只会触发一次，所以如果同时设置两个，第二个ready回调会无效
         * @param {Function} callback 回调函数
         */
        hybridJs.ready = function ready(callback) {
            if (!readyFunc) {
                readyFunc = callback;
                // 如果config先进行，然后才进行ready,这时候恰好又isAllowReady，代表ready可以直接自动执行
                if (isAllowReady) {
                    log("ready!");
                    isAllowReady = false;
                    readyFunc();
                }
            } else {
                showError(
                    globalError.ERROR_TYPE_READYMODIFY.code,
                    globalError.ERROR_TYPE_READYMODIFY.msg
                );
            }
        };

        /**
         * 注册接收原生的错误信息
         */
        JSBridge.registerHandler("handleError", (data) => {
            showError(globalError.ERROR_TYPE_NATIVE.code, JSON.stringify(data));
        });
    }

    function innerUtilMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = {};

        hybridJs.innerUtil = innerUtil;

        /**
         * 将参数兼容字符串形式，返回新的args
         * 正常应该是 object, resolve, reject
         * 兼容的字符串可能是 key1, (key2, key3,) ..., resolve, reject
         * @param {Object} args 原始的参数
         * @param {Object} rest 剩余的参数，相当于从arguments1开始算起
         * @return {Object} 返回标准的参数
         */
        function compatibleStringParamsToObject(args, ...rest) {
            const newArgs = args;

            if (!innerUtil.isObject(newArgs[0])) {
                const options = {};
                const isPromise = !!hybridJs.getPromise();
                const len = newArgs.length;
                const paramsLen = isPromise ? len - 2 : len;

                // 填充字符串key，排除最后的resolve与reject
                for (let i = 0; i < paramsLen; i += 1) {
                    // 注意映射关系，rest[0]相当于以前的arguments[1]
                    if (rest[i] !== undefined) {
                        options[rest[i]] = newArgs[i];
                    }
                }

                // 分别为options，resolve，reject
                newArgs[0] = options;
                if (isPromise) {
                    newArgs[1] = newArgs[len - 2];
                    newArgs[2] = newArgs[len - 1];
                } else {
                    // 去除普通参数对resolve与reject的影响
                    newArgs[1] = undefined;
                    newArgs[2] = undefined;
                }
            }

            // 默认参数的处理，因为刚兼容字符串后是没有默认参数的
            if (
                this.api &&
                this.api.defaultParams &&
                newArgs[0] instanceof Object
            ) {
                Object.keys(this.api.defaultParams).forEach((item) => {
                    if (newArgs[0][item] === undefined) {
                        newArgs[0][item] = this.api.defaultParams[item];
                    }
                });
            }

            // 否则已经是标准的参数形式，直接返回
            return newArgs;
        }

        innerUtil.extend = extend;
        innerUtil.isObject = isObject;
        innerUtil.getFullPath = getFullPath;
        innerUtil.getFullUrlByParams = getFullUrlByParams;
        innerUtil.eclipseText = eclipseText;
        innerUtil.compatibleStringParamsToObject =
            compatibleStringParamsToObject;
    }

    function uiMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = hybridJs.innerUtil;

        hybridJs.extendModule("ui", [
            {
                namespace: "toast",
                os: ["madp"],
                defaultParams: {
                    message: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "message"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "showDebugDialog",
                os: ["madp"],
                defaultParams: {
                    debugInfo: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject(
                        rest,
                        "debugInfo"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "alert",
                os: ["madp"],
                defaultParams: {
                    title: "",
                    message: "",
                    buttonName: "确定",
                    // 默认可取消
                    cancelable: 1,
                },
                // 用confirm来模拟alert
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "message",
                        "title",
                        "buttonName"
                    );

                    args[0].buttonLabels = [args[0].buttonName];
                    hybridJs.ui.confirm.apply(this, args);
                },
            },
            {
                namespace: "confirm",
                os: ["madp"],
                defaultParams: {
                    title: "",
                    message: "",
                    buttonLabels: ["取消", "确定"],
                    // 默认可取消
                    cancelable: 1,
                },
            },
            {
                namespace: "prompt",
                os: ["madp"],
                defaultParams: {
                    title: "",
                    hint: "",
                    text: "",
                    lines: 1,
                    maxLength: 10000,
                    buttonLabels: ["取消", "确定"],
                    // 默认可取消
                    cancelable: 1,
                },
            },
            {
                namespace: "actionSheet",
                os: ["madp"],
                defaultParams: {
                    items: [],
                    // 默认可取消
                    cancelable: 1,
                },
                runCode(...rest) {
                    const args = rest;
                    const options = args[0];
                    const originalItems = options.items;

                    options.dataFilter = (res) => {
                        const newRes = res;
                        let index = -1;
                        let content = "";

                        if (newRes.result) {
                            index = newRes.result.which || 0;
                            content = originalItems[index];
                            // 需要将中文解码
                            newRes.result.content = decodeURIComponent(content);
                        }

                        return newRes;
                    };

                    args[0] = options;
                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "popWindow",
                os: ["madp"],
                defaultParams: {
                    titleItems: [],
                    iconItems: [],
                    iconFilterColor: "",
                },
                /**
                 * 有横向菜单和垂直菜单2种
                 * 可配合setNBRightImage、setNBRightText使用(iOS 不可配合使用)
                 */
                runCode(...rest) {
                    const args = rest;
                    const options = args[0];
                    const originalItems = options.iconItems;

                    // 处理相对路径问题
                    for (
                        let i = 0, len = options.iconItems.length;
                        i < len;
                        i += 1
                    ) {
                        options.iconItems[i] = innerUtil.getFullPath(
                            options.iconItems[i]
                        );
                    }

                    options.dataFilter = (res) => {
                        const newRes = res;
                        let index = -1;
                        let content = "";

                        if (newRes.result) {
                            index = newRes.result.which || 0;
                            content = originalItems[index];
                            // 需要将中文解码
                            newRes.result.content = decodeURIComponent(content);
                        }

                        return newRes;
                    };

                    args[0] = options;
                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "pickDate",
                os: ["madp"],
                defaultParams: {
                    // 部分设备上设置标题后遮挡控件可不设置标题
                    title: "",
                    // 默认为空为使用当前时间
                    // 格式为 yyyy-MM-dd。
                    datetime: "",
                },
            },
            {
                namespace: "pickTime",
                os: ["madp"],
                defaultParams: {
                    // 部分设备上设置标题后遮挡控件可不设置标题
                    title: "",
                    // 默认为空为使用当前时间
                    // 格式为 HH:mm
                    datetime: "",
                },
            },
            {
                namespace: "pickDateTime",
                os: ["madp"],
                defaultParams: {
                    title1: "",
                    title2: "",
                    // 默认为空为使用当前时间
                    // 格式为 yyyy-MM-dd HH:mm
                    datetime: "",
                },
            },
            {
                namespace: "showWaiting",
                os: ["madp"],
                defaultParams: {
                    message: "加载中...",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "message"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "closeWaiting",
                os: ["madp"],
            },
        ]);
    }

    function authMixin(hybrid) {
        const hybridJs = hybrid;

        hybridJs.extendModule("auth", [
            {
                namespace: "getToken",
                os: ["madp"],
            },
            {
                namespace: "config",
                os: ["madp"],
                defaultParams: {
                    // 一个数组，不要传null，否则可能在iOS中会有问题
                    jsApiList: [],
                },
            },
        ]);
    }

    function runtimeMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = hybridJs.innerUtil;

        hybridJs.extendModule("runtime", [
            {
                namespace: "launchApp",
                os: ["madp"],
                defaultParams: {
                    // android应用的包名
                    packageName: "",
                    // android应用页面类名
                    className: "",
                    // android应用页面配置的ActionName
                    actionName: "",
                    // 页面配置的Scheme名字，适用于Android与iOS
                    scheme: "",
                    // 传递的参数。需要目标应用解析获取参数。字符串形式
                    data: "",
                },
            },
            {
                namespace: "getAppVersion",
                os: ["madp"],
            },
            {
                namespace: "getMadpVersion",
                os: ["madp"],
            },
            {
                namespace: "clearCache",
                os: ["madp"],
            },
            {
                namespace: "getGeolocation",
                os: ["madp"],
                defaultParams: {
                    isShowDetail: 0,
                    // 1采用的火星坐标系，0采用地球坐标系
                    coordinate: 1,
                },
            },
            {
                namespace: "clipboard",
                os: ["madp"],
                defaultParams: {
                    text: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "text"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "openUrl",
                os: ["madp"],
                defaultParams: {
                    url: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject(
                        rest,
                        "url"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
        ]);
    }

    function deviceMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = hybridJs.innerUtil;

        hybridJs.extendModule("device", [
            {
                namespace: "setOrientation",
                os: ["madp"],
                defaultParams: {
                    // 1表示竖屏，0表示横屏，-1表示跟随系统
                    orientation: 1,
                },
            },
            {
                namespace: "getDeviceId",
                os: ["madp"],
            },
            {
                namespace: "getVendorInfo",
                os: ["madp"],
            },
            {
                namespace: "getNetWorkInfo",
                os: ["madp"],
            },
            {
                namespace: "callPhone",
                os: ["madp"],
                defaultParams: {
                    phoneNum: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "phoneNum"
                    );
                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "sendMsg",
                os: ["madp"],
                defaultParams: {
                    phoneNum: "",
                    message: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "phoneNum",
                        "message"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "closeInputKeyboard",
                os: ["madp"],
            },
            {
                namespace: "vibrate",
                os: ["madp"],
                defaultParams: {
                    duration: 500,
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "duration"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
        ]);
    }

    function pageMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = hybridJs.innerUtil;

        hybridJs.extendModule("page", [
            {
                namespace: "open",
                os: ["madp"],
                defaultParams: {
                    pageUrl: "",
                    pageStyle: 1,
                    // 横竖屏,默认为1表示竖屏
                    orientation: 1,
                    // 额外数据
                    data: {},
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "pageUrl",
                        "data"
                    );
                    const options = args[0];

                    // 将额外数据拼接到url中
                    options.pageUrl = innerUtil.getFullUrlByParams(
                        options.pageUrl,
                        options.data
                    );
                    // 去除无用参数的干扰
                    options.data = undefined;

                    options.dataFilter = (res) => {
                        const newRes = res;

                        if (!innerUtil.isObject(newRes.result.resultData)) {
                            try {
                                newRes.result.resultData = JSON.parse(
                                    newRes.result.resultData
                                );
                            } catch (e) {}
                        }

                        return newRes;
                    };

                    args[0] = options;
                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "openLocal",
                os: ["madp"],
                defaultParams: {
                    className: "",
                    // 为1则是打开已存在的页面，会杀掉所有该页面上的页面
                    isOpenExist: 0,
                    // 额外数据，注意额外数据只能一层键值对形式，不能再包裹子json
                    data: {},
                },
                runCode(...rest) {
                    const args = rest;
                    const options = args[0];

                    options.dataFilter = (res) => {
                        const newRes = res;

                        if (!innerUtil.isObject(newRes.result.resultData)) {
                            try {
                                newRes.result.resultData = JSON.parse(
                                    newRes.result.resultData
                                );
                            } catch (e) {}
                        }

                        return newRes;
                    };

                    args[0] = options;
                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "close",
                os: ["madp"],
                defaultParams: {
                    // 需要传递的参数，是一个字符串
                    resultData: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "resultData"
                    );

                    if (innerUtil.isObject(args[0].resultData)) {
                        args[0].resultData = JSON.stringify(args[0].resultData);
                    }

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "reload",
                os: ["madp"],
            },
        ]);
    }

    function navigatorMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = hybridJs.innerUtil;

        /**
         * 按钮最多允许6个英文字符，或3个中文
         */
        const MAX_BTN_TEXT_COUNT = 6;

        hybridJs.extendModule("navigator", [
            {
                namespace: "setTitle",
                os: ["madp"],
                defaultParams: {
                    title: "",
                    // 子标题
                    subTitle: "",
                    // 是否可点击，可点击时会有点击效果并且点击后会触发回调，不可点击时永远不会触发回调
                    // 可点击时，title会有下拉箭头
                    // promise调用时和其他长期回调一样立马then
                    direction: "bottom",
                    // 是否可点击，如果为1，代表可点击，会在标题右侧出现一个下拉图标，并且能被点击监听
                    clickable: 0,
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "title"
                    );

                    this.api.isLongCb = true;

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "setMultiTitle",
                os: ["madp"],
                defaultParams: {
                    titles: "",
                },
                runCode(...rest) {
                    this.api.isLongCb = true;

                    hybridJs.callInner.apply(this, rest);
                },
            },
            {
                namespace: "show",
                os: ["madp"],
            },
            {
                namespace: "hide",
                os: ["madp"],
            },
            {
                namespace: "showStatusBar",
                os: ["madp"],
            },
            {
                namespace: "hideStatusBar",
                os: ["madp"],
            },
            {
                namespace: "hideBackButton",
                os: ["madp"],
            },
            {
                namespace: "hookSysBack",
                os: ["madp"],
                runCode(...rest) {
                    this.api.isLongCb = true;

                    hybridJs.callInner.apply(this, rest);
                },
            },
            {
                namespace: "hookBackBtn",
                os: ["madp"],
                runCode(...rest) {
                    this.api.isLongCb = true;

                    hybridJs.callInner.apply(this, rest);
                },
            },
            {
                namespace: "setRightBtn",
                os: ["madp"],
                defaultParams: {
                    text: "",
                    imageUrl: "",
                    isShow: 1,
                    // 对应哪一个按钮，一般是0, 1可选择
                    which: 0,
                },
                runCode(...rest) {
                    const args = rest;
                    const options = args[0];

                    options.imageUrl =
                        options.imageUrl &&
                        innerUtil.getFullPath(options.imageUrl);
                    options.text = innerUtil.eclipseText(
                        options.text,
                        MAX_BTN_TEXT_COUNT
                    );

                    args[0] = options;
                    this.api.isLongCb = true;

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "setRightMenu",
                os: ["madp"],
                defaultParams: {
                    text: "",
                    imageUrl: "",
                    // 过滤色默认为空
                    iconFilterColor: "",
                    // 点击后出现的菜单列表，这个API会覆盖rightBtn
                    titleItems: [],
                    iconItems: [],
                },
                /**
                 * 这个API比较特殊，暂时由前端模拟
                 */
                runCode(...rest) {
                    const newArgs = [].slice.call(rest);
                    const newOptions = innerUtil.extend({}, newArgs[0]);

                    newOptions.success = () => {
                        // 点击的时候，弹出菜单
                        hybridJs.ui.popWindow.apply(this, rest);
                    };

                    newArgs[0] = newOptions;
                    hybridJs.navigator.setRightBtn.apply(this, newArgs);
                },
            },
            {
                namespace: "setLeftBtn",
                os: ["madp"],
                defaultParams: {
                    text: "",
                    imageUrl: "",
                    isShow: 1,
                    // 是否显示下拉箭头,如果带箭头，它会占两个位置，同时覆盖左侧按钮和左侧返回按钮
                    isShowArrow: 0,
                },
                runCode(...rest) {
                    const args = rest;
                    const options = args[0];

                    options.imageUrl =
                        options.imageUrl &&
                        innerUtil.getFullPath(options.imageUrl);
                    options.text = innerUtil.eclipseText(
                        options.text,
                        MAX_BTN_TEXT_COUNT
                    );

                    args[0] = options;
                    this.api.isLongCb = true;

                    hybridJs.callInner.apply(this, args);
                },
            },
        ]);
    }

    function utilMixin(hybrid) {
        const hybridJs = hybrid;
        const innerUtil = hybridJs.innerUtil;
        hybridJs.extendModule("util", [
            {
                namespace: "scan",
                os: ["madp"],
            },
            {
                namespace: "selectFile",
                os: ["madp"],
                defaultParams: {
                    // 文件数量
                    count: 9,
                },
            },
            {
                namespace: "openFile",
                os: ["madp"],
                defaultParams: {
                    path: "",
                },
                runCode(...rest) {
                    // 兼容字符串形式
                    const args = innerUtil.compatibleStringParamsToObject.call(
                        this,
                        rest,
                        "path"
                    );

                    hybridJs.callInner.apply(this, args);
                },
            },
            {
                namespace: "readContact",
                os: ["madp"],
            },
            {
                namespace: "simInfo",
                os: ["madp"],
            },
        ]);
    }

    function pictureMixin(hybrid) {
        const hybridJs = hybrid;
        hybridJs.extendModule("picture", [
            {
                namespace: "selectImage",
                os: ["madp"],
                defaultParams: {
                    // 图片数量
                    photoCount: 9,
                    // 是否允许拍照，1：允许；0：不允许
                    showCamera: 0,
                    // 是否显示gif图片，1：显示；0：不显示
                    showGif: 0,
                    // 是否允许预览，1：允许，0：不允许
                    previewEnabled: 1,
                    // 已选图片，json数组格式，item为元素本地地址
                    selectedPhotos: [],
                },
            },
            {
                namespace: "cameraImage",
                os: ["madp"],
                defaultParams: {
                    isSplice: true,
                    mark: {},
                },
            },
            {
                namespace: "openImage",
                os: ["madp"],
            },
            {
                namespace: "writeSign",
                os: ["madp"],
            },
        ]);
    }

    function rpcMixin(hybrid) {
        const hybridJs = hybrid;
        hybridJs.extendModule("rpc", [
            {
                namespace: "request",
                os: ["madp"],
            },
        ]);
    }

    function cryptMixin(hybrid) {
        const hybridJs = hybrid;
        hybridJs.extendModule("crypt", [
            {
                namespace: "crypt",
                os: ["madp"],
            },
        ]);
    }

    function mathMixin(hybrid) {
        const hybridJs = hybrid;

        hybridJs.extendModule("math", [
            {
                namespace: "add",
                os: ["madp"],
            },
        ]);
    }

    function storageMixin(hybrid) {
        hybrid.extendModule("storage", [
            {
                namespace: "shareStorage",
                os: ["madp"],
            },
        ]);
    }

    function securityMixin(hybrid) {
        const hybridJs = hybrid;

        hybridJs.extendModule("security", [
            {
                namespace: "hasPassGuard",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "newPassGuard",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "initPassGuardKeyBoard",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "StartPassGuardKeyBoard",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "StopPassGuardKeyBoard",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "StopPassGuardKeyBoardAll",
                os: ["madp"],
            },
            {
                namespace: "StopPassGuardKeyBoardAllExceptID",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "setEncrypt",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: false,
                },
            },
            {
                namespace: "setWebViewSyn",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: false,
                },
            },
            {
                namespace: "setButtonPress",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: false,
                },
            },
            {
                namespace: "isWeakPassword",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: "",
                },
            },
            {
                namespace: "newPassGuard",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "setMaxLength",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    maxLength: 16,
                },
            },
            {
                namespace: "setInputRegex",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    regex: "",
                },
            },
            {
                namespace: "setMatchRegex",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    regex: "",
                },
            },
            {
                namespace: "setReorder",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    type: 0,
                },
            },
            {
                namespace: "checkMatch",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "getPassLevel",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "useNumberPad",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    use: false,
                },
            },
            {
                namespace: "setCipherKey",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    key: "",
                },
            },
            {
                namespace: "setEccKey",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    key: "",
                },
            },
            {
                namespace: "getOutput1",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "getText",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "getMD5",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "getLength",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "getCiphertext",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "isKeyBoardShowing",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "hasKeyBoardShowing",
                os: ["madp"],
            },
            {
                namespace: "setWatchOutside",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: false,
                },
            },
            {
                namespace: "EditTextAlwaysShow",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: false,
                },
            },
            {
                namespace: "hasSM204",
                os: ["madp"],
                defaultParams: {
                    id: "",
                    need: false,
                },
            },
            {
                namespace: "clear",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "destory",
                os: ["madp"],
                defaultParams: {
                    id: "",
                },
            },
            {
                namespace: "gesture",
                os: ["madp"],
                defaultParams: {
                    gestureType: "",
                },
            },
        ]);
    }

    function sysSettingsMixin(hybrid) {
        const hybridJs = hybrid;
        hybridJs.extendModule("sysSettings", [
            {
                namespace: "openAccessSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openAddAccount",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openAirplaneSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openAPNSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openApplicationDevSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openApplicationDetailsSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openApplicationSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openBlueoothSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openDataRoamingSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openDeviceInfoSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openDisplaySettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openInputMethodSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openInputMethodSubtypeSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openInternalStorageSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openMemoryCardSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openLocaleSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openLocationSourceSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openNetworkOperatorSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openNFCSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openPrivacySettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openQuickLaunchSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openSearchSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openSecuritySettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openSoundSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openSyncSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openUserDictionarySettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openWifiIpSettings",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "openWifiSettings",
                os: ["madp"],
                defaultParams: {},
            },
        ]);
    }

    function aiMixin(hybrid) {
        const hybridJs = hybrid;
        hybridJs.extendModule("ai", [
            {
                namespace: "startTranscribe",
                os: ["madp"],
                defaultParams: {},
            },
            {
                namespace: "stopTranscribe",
                os: ["madp"],
                defaultParams: {},
            },
        ]);
    }

    function mixin(hybrid) {
        const hybridJs = hybrid;

        osMixin(hybridJs);
        promiseMixin(hybridJs);
        errorMixin(hybridJs);
        // 赖于promise，是否有Promise决定返回promise对象还是普通函数
        proxyMixin(hybridJs);
        // 依赖于showError，globalError，os
        jsbridgeMixin(hybridJs);
        // api没有runcode时的默认实现，依赖于jsbridge与os
        callinnerMixin(hybridJs);
        // 依赖于os，Proxy，globalError，showError，以及callInner
        defineapiMixin(hybridJs);
        // 依赖于JSBridge，Promise,sbridge
        callnativeapiMixin(hybridJs);
        // init依赖与基础库以及部分原生的API
        initMixin(hybridJs);
        // 给API快速使用的内部工具集
        innerUtilMixin(hybridJs);

        uiMixin(hybridJs);
        authMixin(hybridJs);
        runtimeMixin(hybridJs);
        deviceMixin(hybridJs);
        pageMixin(hybridJs);
        navigatorMixin(hybridJs);
        utilMixin(hybridJs);
        pictureMixin(hybridJs);
        rpcMixin(hybridJs);
        cryptMixin(hybridJs);
        mathMixin(hybridJs);
        storageMixin(hybridJs);
        securityMixin(hybridJs);
        sysSettingsMixin(hybridJs);
        aiMixin(hybridJs);
    }

    const hybridJs = {};

    mixin(hybridJs);

    hybridJs.Version = "1.0.0";

    return hybridJs;
});
