// AI 摘要服务

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  readingTime: number;
}

// 模拟 AI 摘要（实际使用时替换为 OpenAI 调用）
export async function generateSummary(content: string, title: string): Promise<SummaryResult> {
  try {
    console.log(`[AI] 生成摘要: ${title}`);
    
    // 提取前500字作为摘要（模拟）
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = text.split(/[。！？.!?]/).filter(s => s.length > 10);
    
    // 取前3句作为摘要
    const summary = sentences.slice(0, 3).join('。') + '。';
    
    // 提取关键词作为要点
    const keyPoints = [
      '文章核心观点概述',
      '关键信息提炼',
      '重要结论总结'
    ];
    
    // 计算阅读时间
    const wordCount = text.length;
    const readingTime = Math.ceil(wordCount / 300);

    console.log(`[AI] 摘要生成完成`);

    return {
      summary: summary || '暂无摘要',
      keyPoints,
      readingTime: readingTime || 1,
    };
  } catch (error) {
    console.error('[AI] 摘要生成失败:', error);
    return {
      summary: '摘要生成失败',
      keyPoints: [],
      readingTime: 1,
    };
  }
}

// 使用 OpenAI 的真实摘要（需要 API Key）
export async function generateSummaryWithOpenAI(content: string, title: string, apiKey: string): Promise<SummaryResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文章摘要助手。请用中文生成简洁的摘要，并提取3-5个关键要点。'
          },
          {
            role: 'user',
            content: `标题：${title}\n\n内容：${content.substring(0, 3000)}\n\n请生成：\n1. 一句话摘要（50字以内）\n2. 3-5个关键要点`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data: any = await response.json();
    const result = data.choices[0]?.message?.content || '';
    
    // 解析结果
    const lines = result.split('\n').filter((l: string) => l.trim());
    const summary = lines[0] || '暂无摘要';
    const keyPoints = lines.slice(1).filter((l: string) => l.match(/^\d+\./));

    return {
      summary,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['关键信息待提取'],
      readingTime: Math.ceil(content.length / 300),
    };
  } catch (error) {
    console.error('[AI] OpenAI 调用失败:', error);
    // 降级到本地摘要
    return generateSummary(content, title);
  }
}
