# HtmlConvertToCss
===================

Html转Css 小工具
----------------------
    
<a href="http://www.linwu.name/HtmlConvertToCss" target="_blank">传送门</a>   
     

在前端开发的过程中，我们通常是先写html结构，然后在css文件里把用到的class列出来，然后逐个写上样式。     
但是，作为一个比较懒的程序员，怎么能忍受那么复杂的工作，所以就写了这个脚本。     

工具背后的一些事可以看我博客文章 [Css小工具 -- HtmlConvertToCss](http://www.linwu.name/articles/csstools-htmlConvertToCss-intro.html)
   
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