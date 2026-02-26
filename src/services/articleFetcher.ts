import axios from 'axios';
import * as cheerio from 'cheerio';

interface ArticleContent {
  title: string;
  content: string;
  author?: string;
  source?: string;
  imageUrl?: string;
  readTime: number;
}

// 抓取网页文章内容
export async function fetchArticleContent(url: string): Promise<ArticleContent | null> {
  try {
    console.log(`[Fetch] 正在抓取: ${url}`);
    
    // 设置请求头模拟浏览器
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // 提取标题
    let title = $('h1').first().text() || 
                $('title').text() || 
                $('meta[property="og:title"]').attr('content') ||
                '无标题';
    title = title.trim();

    // 提取正文（尝试多种选择器）
    let content = '';
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '#article-content',
      '.content',
      'main',
      '[class*="content"]',
      'body'
    ];
    
    for (const selector of contentSelectors) {
      const el = $(selector).first();
      if (el.length && el.text().length > 200) {
        content = el.html() || el.text();
        break;
      }
    }

    // 清理内容
    content = content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<nav[^>]*>.*?<\/nav>/gi, '')
      .replace(/<header[^>]*>.*?<\/header>/gi, '')
      .replace(/<footer[^>]*>.*?<\/footer>/gi, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .trim();

    // 提取作者
    const author = $('meta[name="author"]').attr('content') ||
                   $('.author').first().text() ||
                   $('[class*="author"]').first().text() ||
                   undefined;

    // 提取来源
    const source = new URL(url).hostname.replace(/^www\./, '');

    // 提取封面图
    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('article img').first().attr('src') ||
                    $('.content img').first().attr('src') ||
                    undefined;

    // 计算阅读时间（平均每分钟300字）
    const textLength = content.replace(/<[^>]*>/g, '').length;
    const readTime = Math.ceil(textLength / 300);

    console.log(`[Fetch] 成功: ${title} (${readTime}分钟)`);

    return {
      title,
      content,
      author: author?.trim() || undefined,
      source,
      imageUrl,
      readTime: readTime || 1,
    };
  } catch (error) {
    console.error(`[Fetch] 抓取失败: ${url}`, error);
    return null;
  }
}

// 提取纯文本（用于摘要）
export function extractText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000); // 限制长度
}
