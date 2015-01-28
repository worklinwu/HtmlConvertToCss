/*
 * file name :
 * author : linwu
 * datetime : 2015-1-22
 */
var cssFactory;
var editor_code_source;
var $btn_analysis = $("#j_btn_analysis");
var $top_level_class = $("#top_level_class");
var $no_extend_class = $("#no_extend_class");
var $status_class = $("#status_class");
var $ignore_class = $("#ignore_class");
var input_config = {};

$(function () {
    initTab();
    initEditer();
    initCssFactory();
    initZeroClipboard();

    if (window.localStorage) {
        if (localStorage.getItem("cssFactory_input_config")) {
            input_config = JSON.parse(localStorage.getItem("cssFactory_input_config"));
            $top_level_class.val(input_config.top_level_class);
            $no_extend_class.val(input_config.no_extend_class);
            $status_class.val(input_config.status_class);
            $ignore_class.val(input_config.ignore_class);
        }
    }

    $(".m-cssfactory .ui-tab-nav li").on("click", function () {
        var $this = $(this);
        if ($this.index() == 0) {
            $btn_analysis.removeClass("disabled");
        } else {
            $btn_analysis.addClass("disabled");
        }
    });

    $btn_analysis.on("click", function () {
        var $this = $(this);

        input_config = {
            top_level_class: $top_level_class.val(),
            no_extend_class: $no_extend_class.val(),
            status_class: $status_class.val(),
            ignore_class: $ignore_class.val()
        };
        localStorage.setItem("cssFactory_input_config", JSON.stringify(input_config));

        if (!$this.hasClass("disabled")) {
            $(".m-cssfactory .ui-tab-nav li:eq(1)").trigger("click");
        }
    });

});

/**
 * 初始化选项卡
 * author : lw
 */
function initTab() {
    // 约定, 选项卡导航包含在".ui-tab-nav"内, 对应的选项卡内容必须有".ui-tab-content"样式, 并按导航的顺序排放.
    var fn_tab = function (e, $tab) {
        var $this = $(this);
        var $tab = $this.closest(".ui-tab,.ui-tab-hover");
        var $tab_nav_item = $this;
        var tab_index;

        e.preventDefault();

        while (!$tab_nav_item.parent().hasClass("ui-tab-nav")) {
            $tab_nav_item = $tab_nav_item.parent();
        }
        tab_index = $tab_nav_item.index();

        $tab.find(".ui-tab-content.active,.ui-tab-nav .active").removeClass("active");
        $tab.find(".ui-tab-nav").children().eq(tab_index).add($tab.find(".ui-tab-content").eq(tab_index)).addClass("active");
        if (!!$.fn.lazyload) {
            $tab.find(".ui-tab-content").eq(tab_index).find("img").trigger("appear");
        }
    };
    if ($(".ui-tab").length > 0) {
        $(".ui-tab").on("click", ".ui-tab-nav li", function (e) {
            fn_tab.call(this, e);
        });
    }
    if ($(".ui-tab-hover").length > 0) {
        $(".ui-tab-hover").on("hover", ".ui-tab-nav li", function (e) {
            fn_tab.call(this, e);
        });
    }
}

/**
 * 初始化编辑器
 */
function initEditer() {
    editor_code_source = CodeMirror.fromTextArea(document.getElementById("j_code_source"), {
        lineNumbers: true,
        tabSize: 4,
        lineWrapping: true,
        styleActiveLine: false,
        matchBrackets: false,
        mode: "xml",
        theme: "pastel-on-dark"
    });
    CodeMirror.on(editor_code_source, "change", function (e) {
        $("#j_code_source").val(e.getValue());
    });
}

/**
 * 初始化代码工厂
 */
function initCssFactory() {
    if (window.CssFactory) {
        cssFactory = new CssFactory({
            beforeAnalysis: function () {
                var $top_level_class = $("#top_level_class");
                var $no_extend_class = $("#no_extend_class");
                var $status_class = $("#status_class");
                var $ignore_class = $("#ignore_class");

                cssFactory.config({
                    arr_top_level_class: $top_level_class.val().replace("/\\/g", "\\\\").split(/\s*,\s*/),
                    arr_no_extend_class: $no_extend_class.val().split(/\s*,\s*/),
                    arr_status_class: $status_class.val().split(/\s*,\s*/),
                    arr_ignore_class: $ignore_class.val().split(/\s*,\s*/)
                }, true);
            }
        });
    }
}

function initZeroClipboard() {
    var copy_btn = new ZeroClipboard(document.getElementById("j_btn_copy"));

    copy_btn.on("ready", function (readyEvent) {
        copy_btn.on("aftercopy", function (event) {
            // `this` === `client`
            // `event.target` === the element that was clicked
            $(event.target).text("已复制!").addClass("active");
            setTimeout(function () {
                $(event.target).text("复制代码").removeClass("active");
            },3000);
            //console.log("Copied text to clipboard: " + event.data["text/plain"]);
        });
    });
}