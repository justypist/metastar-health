# 研究平台 - 开放 API 接⼝转换SKILLS

> 优先级 8 9 7 10 4

## TypeScript API 客户端

先在 `.env` 中配置开放 API 密钥：

```dotenv
APP_KEY=your_app_key
APP_SECRET=your_app_secret
```

从统一入口导入函数后即可调用：

```ts
import { searchPapers, submitOcrTask, pollOcrResult } from "./api/index.ts";

const papers = await searchPapers({ disease: "diabetes", limit: 10 });

const { taskId } = await submitOcrTask("./document.pdf");
const ocrTask = await pollOcrResult(taskId, { intervalMs: 5000, timeoutMs: 600000 });

console.log(papers.total, ocrTask.result?.downloadUrl);
```
