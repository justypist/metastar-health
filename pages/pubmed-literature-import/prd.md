## Project X
- 弹窗组件
  - 意图解析query->文件搜索keyword关键词
  - pubmed 搜索窗口
    - 得到列表(title+desc)+metastar接口确认文献是否在
    - 不在的话需要用户上传
    - 上传后走metastar解析，得到结果

---

创建一个新的前端组件，它是另一个react弹窗组件的一部分，最终会合并回弹窗组件中，我们只做部分工作跑通流程，为其他组件节省一部分工作。无需使用react实现，最终会通过AI合并回react项目中。

一共分N步

- 意图解析query->文件搜索keyword关键词

用户输入一句话/一个问题，通过AI将其拆分成关键词列表，用于pubmed搜索

- pubmed 搜索窗口

拆分关键词后弹出pubmed搜索窗口，触发 pubmed api 进行搜索

- 得到列表(title+desc)

渲染 pubmed api 返回结果列表，标准的 title + desc 卡片列表形式（直接仿照pubmed列表形式即可）

- metastar接口确认文献是否在

调用当前项目中已有的api用于检测每一项结果是否存在于 metastar 系统中

- 不在的话需要用户上传

已存在的列表项使用绿色tag标记，不存在的使用红色tag标记，并且列表item添加action “upload”，让用户自己上传对应缺失的文档

- 上传后走metastar解析，得到结果

用户上传后使用当前项目中已有的接口分析分到，得到结果，通过 console.log 打印到控制台，并且标记列表项为已上传（蓝色tag）