# HtmlConvertToCss
----------------------
Html转Css 小工具
----------------------
    
<a href="http://www.linwu.name/HtmlConvertToCss" target="_blank">传送门</a>   
     
这是一个神（pǔ）奇（tōng）的工具。   

在前端开发的过程中，我们通常是先写html结构，然后在css文件里把用到的class列出来，然后逐个写上样式。     
但是，作为一个比较懒的程序员，怎么能忍受那么复杂的工作，所以就写了这个脚本。     

工具背后的一些事可以看我博客文章 [Css小工具 -- HtmlConvertToCss](http://www.linwu.name/articles/csstools-htmlConvertToCss-intro.html)
   
可将你贴进来的HTML代码转换成Css代码。   
例如 : 
```html
<div class="ui-box">
    <div class="boxhd">
        <span class="boxtit">这是标题</span>
        <a href="#" class="boxmore">更多&gt;&gt;</a>
    </div>
    <div class="boxbd">
    </div>
</div>
```
处理后生成   
```css
.ui-box{ }
.ui-box .boxhd{}
.ui-box .boxhd .boxtit{}
.ui-box .boxhd .boxmore{}
.ui-box .boxhd .boxmore:hover{}
.ui-box .boxbd{}
```

---------------------------------------

### 配置说明
- 顶级样式关键字
    例如`^.m-`    
    ```html
    <div class="demo">
        <div class="m-box">
        </div>
    </div>
    ```  
    转换后生成 (忽略前面的`demo`的样式继承)  
    ```css
    .m-box{}
    ```
- 不继承的样式关键字
    排除一些已经定义过的样式，例如`ui-box`   
    ```html
    <div class="demo">
        <div class="ui-box">
        </div>
    </div>
    ```   
    转换后生成   
    ```css
    .demo{}
    ```
- 状态样式
    多样式的处理，例如`ui-box`   
    ```html
    <div class="demo">
        <div class="ui-box active">
        </div>
    </div>
    ```  
    转换后生成   
    ```css
    .demo{}
    .demo .ui-box{}
    .demo .ui-box.active{}
    ```   
- 忽略的样式    
    例如`ui-box`   
    ```html
    <div class="demo clearfix">
    </div>
    ```  
    转换后生成   
    ```css
    .demo{}
    ```   

------------------------------

   
如果你在使用中有遇到问题或有什么意见，可以到我的项目下Issues。