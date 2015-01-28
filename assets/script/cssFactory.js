/*
 * file name : Css 工厂
 * author : linwu
 * datetime : 2015-1-22
 * depend : jquery
 */
(function () {
    var CssFactory = function CssFactory(_opts) {
        var _this = this;
        _this.html_code = null;    // 输入的html
        _this.html_code_dom = null;    // 转换后的html
        _this.result_json_arr = [];  // 解析的json数组集
        _this.result_css = [];  // 最终结果集
        // 默认参数
        _this.options = $.extend({}, CssFactory.default, _opts);

        // 绑定事件
        $(_this.options.btn_analysis).off("click.cssFactory").on("click.cssFactory", function (e) {
            e.preventDefault();
            _this.render.call(_this);
        });

        _this.afterInit && _this.afterInit.call(_this);
    };

    CssFactory.default = {
        arr_top_level_class: ["^\\.m-"],  // 顶级样式前缀, 正则
        arr_no_extend_class: ["ui-box", "ui-tab"],  // 不需要继承的样式前缀, 正则
        arr_status_class: ["show", "hide", "hidden", "cur", "current", "open", "close", "active"],  // 状态样式
        arr_ignore_class: ["^\\.f-", "^\\.j-", "clearfix"],  // 不需要解析的样式前缀, 正则
        btn_analysis: "#j_btn_analysis",  // 不需要解析的样式前缀, 正则
        code_source: "#j_code_source",  // 源代码
        code_result: "#j_code_result",  // 输出的位置
        is_analysis_id: false,    // 是否解析id的样式
        afterInit: null,
        beforeAnalysis: null,
        afterAnalysis: null,
        beforeRender: null,
        afterRender: null
    };

    CssFactory.prototype = {
        /**
         * 指定构造函数
         */
        constructor: CssFactory,
        /**
         * 重载配置
         * @param _opts 新的配置参数
         */
        config: function (_opts, _rewrite) {
            var _this = this;
            _rewrite = _rewrite ? _rewrite : false;

            if (_rewrite) {
                _this.options = $.extend({}, _this.options, _opts);
                for (var key in _opts) {
                    _this.options[key] = _opts[key];
                }
            } else {
                _this.options = $.extend({}, _this.options, _opts);
            }
            console.log(_this.options);
        },
        /**
         * 解析并输出htmlCode
         */
        render: function () {
            var _this = this;
            var $code_result = $(_this.options.code_result);
            var $code_source = $(_this.options.code_source);
            if (_this.constructor !== CssFactory) {
                return;
            }

            //  重置结果集
            _this.result_json_arr = [];
            _this.result_css = [];

            // 1. 获取输入的html文本.
            _this.html_code = $code_source.val().replace(/src=['|"].*['|"]/ig, "").replace(/<!--.*-->/ig, "");
            // 2. 解析成Dom元素, 放入内存中.
            if(!_this.html_code.trim()){
                return;
            }
            _this.html_code_dom = $(_this.html_code);
            // 3. 遍历, 从外层往内层遍历, 将每个DOM元素的"标签名","id","class"的值保存到一个json格式的数组, 没个json对象有个"extend"的额外对象, 记录层级的深度.
            _this.options.beforeAnalysis && _this.options.beforeAnalysis.call(_this);
            convertHtmlToArr(_this.html_code_dom);
            _this.options.afterAnalysis && _this.options.afterAnalysis.call(_this);
            // 4. 输出
            console.log(_this.result_json_arr);
            _this.options.beforeRender && _this.options.beforeRender.call(_this);
            analysisArr();
            filterResult();
            // 输出
            _this.result_css = _this.tools.arrUnique(_this.result_css);
            $code_result.html("");
            for (var k = 0; k < _this.result_css.length; k++) {
                $code_result.append(_this.result_css[k] + "{} \r\n");
            }
            _this.options.afterRender && _this.options.afterRender.call(_this);

            /**
             * 处理html, 生成对应的数组 [递归函数]
             * @param _current_dom
             * @param _dom_extend
             */
            function convertHtmlToArr(_current_dom, _dom_extend) {
                var $children;
                var result = {};
                _dom_extend = _dom_extend ? _dom_extend : "";

                // 获取值
                result.id = _current_dom.attr("id");
                result.class = _current_dom.attr("class"); // 可能包含多个class
                result.tagName = _current_dom[0].tagName.toLowerCase();
                result.extend = _dom_extend;

                // 添加当前值
                _this.result_json_arr.push(result);

                // 判断是否有子元素
                $children = _current_dom.children();
                if ($children.length > 0) {
                    // 判断是用class来继承还是用tagname来继承
                    if (result.class && result.class != "") {
                        _dom_extend = (_dom_extend + " ." + result.class.split(/\s+/)[0]).trim();
                    } else {
                        _dom_extend = (_dom_extend + " " + result.tagName).trim();
                    }
                    // 递归, 解析子元素
                    for (var i = 0; i < $children.length; i++) {
                        convertHtmlToArr($children.eq(i), _dom_extend);
                    }
                }
            }

            /**
             * 处理输出的数组结果
             */
            function analysisArr() {
                for (var i = 0; i < _this.result_json_arr.length; i++) {
                    var cur_json = _this.result_json_arr[i];
                    var cur_json_extend = cur_json.extend ? (cur_json.extend + " ") : "";
                    var class_arr = cur_json.class ? cur_json.class.split(/\s+/) : [];
                    // 是否解析ID
                    if (_this.options.is_analysis_id) {
                        if (cur_json.id && cur_json.id != "" && !$.inArray(cur_json.id.substr(0, 2), ["j_", "j-", "js"]) > -1) {
                            _this.result_css.push("#" + cur_json.id);
                        }
                    }
                    // 生成class规则
                    if (cur_json.class && cur_json.class.trim() != "") {
                        for (var j = 0; j < class_arr.length; j++) {
                            // 解析class
                            if ($.inArray(class_arr[j], _this.options.arr_status_class) > -1 && class_arr.length > 1) {
                                _this.result_css.push(cur_json_extend + class_arr[0] + "." + class_arr[j]);
                            } else {
                                _this.result_css.push(cur_json_extend + "." + class_arr[j]);
                            }
                        }
                    } else {
                        // 标签名
                        _this.result_css.push(cur_json_extend + cur_json.tagName);
                    }
                    // 如果是a标签
                    if (cur_json.tagName == "a") {
                        if (class_arr[0] && class_arr[0] != "" && !_this.tools.inArrayByRegExp(class_arr[0], _this.options.arr_ignore_class) > -1) {
                            _this.result_css.push(cur_json_extend + "." + class_arr[0] + ":hover");
                        } else {
                            _this.result_css.push(cur_json_extend + cur_json.tagName + ":hover");
                        }
                    }
                }
            }// analysisArr

            /**
             * 过滤结果集
             */
            function filterResult() {
                var _cur_css;
                var _cur_arr;
                for (var i = 0; i < _this.result_css.length; i++) {
                    _cur_css = _this.result_css[i];
                    _cur_arr = _cur_css.trim().split(/\s+/);
                    // 过滤忽略的样式
                    if (_this.tools.inArrayByRegExp(_cur_arr[_cur_arr.length - 1].substr(1), _this.options.arr_ignore_class)) {
                        _this.result_css.splice(i, 1);
                        continue;
                    }
                    // 过滤顶级样式前面的继承链
                    for (var j = 0; j < _cur_arr.length; j++) {
                        if (_this.tools.inArrayByRegExp(_cur_arr[j], _this.options.arr_top_level_class)) {
                            _cur_arr.splice(0, j);
                            break;
                        }
                    }
                    // 过滤不继承的样式
                    for (var k = 0; k < _cur_arr.length;) {
                        if (_this.tools.inArrayByRegExp(_cur_arr[k], _this.options.arr_no_extend_class) && k != _cur_arr.length - 1) {
                            _cur_arr.splice(k, 1);
                        } else {
                            k++;
                        }
                    }
                    _this.result_css[i] = _cur_arr.join(" ");
                }
            }// filterResult

        }
    };

    CssFactory.prototype.tools = {
        /**
         * 数组去重
         * @param arr
         * @returns {Array}
         */
        arrUnique: function (arr) {
            var ret = [];
            var hash = {};

            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                var key = typeof(item) + item;
                if (hash[key] !== 1) {
                    ret.push(item);
                    hash[key] = 1
                }
            }
            return ret
        },
        inArrayByRegExp: function (val, regExpArr) {
            var result = false;
            for (var i = 0; i < regExpArr.length; i++) {
                if ((new RegExp(regExpArr[i])).test(val)) {
                    result = true;
                    break;
                }
            }
            return result;
        }
    };

    window.CssFactory = CssFactory;
})();