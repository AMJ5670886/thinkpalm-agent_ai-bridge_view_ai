const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function queryGroq(
  prompt: string,
  apiKey: string,
  maxTokens = 4000
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Empty response from Groq API');
  }

  return text;
}

export function stripMarkdownFences(text: string, type: 'json' | 'code' = 'code'): string {
  if (type === 'json') {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  return text
    .replace(/```typescript/g, '')
    .replace(/```tsx/g, '')
    .replace(/```javascript/g, '')
    .replace(/```jsx/g, '')
    .replace(/```/g, '')
    .trim();
}
