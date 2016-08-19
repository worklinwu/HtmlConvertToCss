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
        less_style: false,
        media_support: false,
        btn_analysis: "#j_btn_analysis",  // 解析代码按钮
        code_source: "#j_code_source",  // 输入的位置
        code_result: "#j_code_result",  // 输出的位置
        is_analysis_id: false,    // 是否解析id的样式  TODO
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
         * @param _rewrite 重写的配置参数
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
            //console.log(_this.options);
        },
        /**
         * 解析并输出htmlCode
         * 思路 : 通过 jquery 来解析 dom, 得到目标 dom 树, 遍历 dom 节点按照一定的规则提取需要的数据.
         */
        render: function () {
            var _this = this;
            var $code_result = $(_this.options.code_result);
            var $code_source = $(_this.options.code_source);
            var _result = "";

            if (_this.constructor !== CssFactory) {
                return;
            }

            //  重置结果集
            $code_result.val("");
            _this.result_json_arr = [];
            _this.result_css = [];

            // 1. 获取输入的html文本.
            _this.html_code = $code_source.val().replace(/src=['|"].*['|"]/ig, "").replace(/<!--.*-->/ig, "");
            // 2. 解析成Dom元素, 放入内存中.
            if (!_this.html_code.trim()) {
                return;
            }
            // 方便通过"children"计算代码块, 防止输入多段代码
            _this.html_code_dom = $("<div class='__temp__'>" + _this.html_code + "</div>");
            // 3. 遍历, 从外层往内层遍历, 将每个DOM元素的"标签名","id","class"的值保存到一个json格式的数组, 
            //     每个json对象有个"extend"的额外对象, 记录层级的深度.
            _this.options.beforeAnalysis && _this.options.beforeAnalysis.call(_this);
            // 判断是要输出那种风格的 css
            if (_this.options.less_style) {
                var domObj = getLessStyleObj(_this.html_code_dom);
                _result = getLessStyleCss(domObj, 1);
            } else {
                convertHtmlToArr(_this.html_code_dom);
                // 删除前面加了一层辅助 div (class="__temp__")
                _this.result_json_arr.splice(0, 1);
                _this.options.afterAnalysis && _this.options.afterAnalysis.call(_this);
                // 4. 输出
                //console.log(_this.result_json_arr);
                _this.options.beforeRender && _this.options.beforeRender.call(_this);
                // 解析结果
                analysisArr();
                // 过滤不要的数据
                filterResult();
                // 输出
                _this.result_css = _this.tools.arrUnique(_this.result_css); // 去重
                for (var k = 0; k < _this.result_css.length; k++) {
                    if (_this.result_css[k].trim() != "") {
                        _result = _result + _this.result_css[k] + " { } \r\n";
                    }
                }
            }
            $code_result.val(_result);
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
             * 把 dom 转换成对象, 这样做主要是为了好去重
             * @param _current_dom
             * @returns {{}}
             */
            function getLessStyleObj(_current_dom) {
                var $children;
                var obj = {};

                // 获取值
                obj.id = _current_dom.attr("id");
                obj.class = _current_dom.attr("class"); // 可能包含多个class
                obj.class_arr = obj.class ? obj.class.split(/\s+/) : []; // 可能包含多个class
                obj.tagName = _current_dom[0].tagName.toLowerCase();

                obj.children = [];
                $children = _current_dom.children();
                if ($children.length > 0) {
                    // 递归, 解析子元素
                    for (var i = 0; i < $children.length; i++) {
                        obj.children.push(getLessStyleObj($children.eq(i), obj));
                    }
                }

                return obj;
            }

            /**
             * 获取 Less/Scss 风格 css
             * @param _dom_obj
             * @param _deep
             * @returns {string}
             */
            function getLessStyleCss(_dom_obj, _deep) {
                var x_result = "";
                // 添加当前值
                //_this.result_json_arr.push(result);
                x_result += outputSpace(_deep * 4);
                if (_this.options.is_analysis_id && _dom_obj.id && _dom_obj.id != "" && !$.inArray(_dom_obj.id.substr(0, 2), ["j_", "j-", "js"]) > -1) {
                    x_result += "#" + _dom_obj.id + " { \r\n";
                } else
                // 生成class规则  (如果包含忽略的元素, 用标签来继承)
                if (_dom_obj.class && _dom_obj.class.trim() != "" && !_this.tools.inArrayByRegExp(_dom_obj.class.split(/\s+/)[0], _this.options.arr_ignore_class)) {
                    if (_dom_obj.class_arr.length > 0) {
                        x_result += "." + _dom_obj.class_arr[0] + " { \r\n";
                    }
                    // 多 class 处理
                    for (var j = 1; j < _dom_obj.class_arr.length; j++) {
                        // 解析class , 状态样式
                        if ($.inArray(_dom_obj.class_arr[j], _this.options.arr_status_class) > -1 && _dom_obj.class_arr.length > 1) {
                            x_result += outputSpace(4) + "&." + _dom_obj.class_arr[j] + " { }\r\n";
                        }
                    }
                } else {
                    // 标签名
                    x_result += _dom_obj.tagName + " { \r\n";
                }
                // 判断是否有子元素
                if (_dom_obj.children.length > 0) {
                    _dom_obj.children = _this.tools.undulpicate(_dom_obj.children);
                    // 递归, 解析子元素
                    for (var i = 0; i < _dom_obj.children.length; i++) {
                        x_result += getLessStyleCss(_dom_obj.children[i], _deep + 1);
                    }
                }
                x_result += outputSpace(_deep * 4) + "}\r\n";

                return x_result;
            }

            /**
             * 输出空格
             * @param num
             * @returns {string}
             */
            function outputSpace(num) {
                var result = "";
                for (var i = 0; i < num; i++) {
                    result += " ";
                }
                return result;
            }

            /**
             * 处理输出的数组结果
             */
            function analysisArr() {
                for (var i = 0; i < _this.result_json_arr.length; i++) {
                    var cur_json = _this.result_json_arr[i]; // 当前节点
                    var cur_json_extend = cur_json.extend ? (cur_json.extend + " ") : ""; // 当前节点继承的节点
                    var class_arr = cur_json.class ? cur_json.class.split(/\s+/) : []; // 当前节点的 class
                    // 按 ID > class > tagName 的顺序解析
                    // 是否解析ID
                    if (_this.options.is_analysis_id) {
                        // 过滤不需要处理的 id
                        if (cur_json.id && cur_json.id != "" && !$.inArray(cur_json.id.substr(0, 2), ["j_", "j-", "js"]) > -1) {
                            _this.result_css.push("#" + cur_json.id);
                        }
                    }
                    // 生成class规则  (如果包含忽略的元素, 用标签来继承)
                    if (cur_json.class && cur_json.class.trim() != "" && !_this.tools.inArrayByRegExp(cur_json.class.split(/\s+/)[0], _this.options.arr_ignore_class)) {
                        for (var j = 0; j < class_arr.length; j++) {
                            // 解析class , 状态样式
                            if ($.inArray(class_arr[j], _this.options.arr_status_class) > -1 && class_arr.length > 1) {
                                _this.result_css.push(cur_json_extend + " ." + class_arr[0] + "." + class_arr[j]);
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
                var _cur_arr_last;
                for (var i = 0; i < _this.result_css.length; i++) {
                    _cur_css = _this.result_css[i];
                    _cur_arr = _cur_css.replace(/\.__temp__/ig, "").trim().split(/\s+/);
                    _cur_arr_last = _cur_arr[_cur_arr.length - 1];
                    // 过滤固定标签
                    if (_cur_arr_last == "br") {
                        _this.result_css.splice(i, 1);
                        i--;
                        continue;
                    }
                    // 过滤忽略的样式
                    if (_this.tools.inArrayByRegExp(_cur_arr[_cur_arr.length - 1], _this.options.arr_ignore_class)) {
                        _this.result_css.splice(i, 1);
                        i--;
                        continue;
                    }
                    // 过滤顶级样式前面的继承链 (例如,  .m-xx 是顶级 class,  那么就把它前面的样式都去掉)
                    for (var j = _cur_arr.length - 1; j >= 0; j--) {
                        //console.log(_cur_arr[j] + ":" + _this.tools.inArrayByRegExp(_cur_arr[j], _this.options.arr_top_level_class));
                        if (_this.tools.inArrayByRegExp(_cur_arr[j], _this.options.arr_top_level_class)) {
                            _cur_arr.splice(0, j);
                            break;
                        }
                    }
                    // 过滤不继承的样式 (忽略样式也是不继承样式)
                    for (var k = 0; k < _cur_arr.length;) {
                        if (_this.tools.inArrayByRegExp(_cur_arr[k], _this.options.arr_no_extend_class) || _this.tools.inArrayByRegExp(_cur_arr[k], _this.options.arr_ignore_class) && k != _cur_arr.length - 1) {
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
        undulpicate: function (array) {
            for (var i = 0; i < array.length; i++) {
                for (var j = i + 1; j < array.length; j++) {
                    //注意 ===
                    if (JSON.stringify(array[i]) === JSON.stringify(array[j])) {
                        array.splice(j, 1);
                        j--;
                    }
                }
            }
            return array;
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
