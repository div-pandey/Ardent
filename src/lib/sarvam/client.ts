/**
 * Sarvam AI Client
 * Handles all communication with the Sarvam AI API.
 * 
 * NOTE: sarvam-30b is a reasoning model. It splits output between:
 *   - `reasoning_content`: internal chain-of-thought (not shown to user)
 *   - `content`: the final answer
 * If max_tokens is too low, all tokens are consumed by reasoning and content is null.
 * We use generous defaults and a fallback extraction strategy.
 */

const SARVAM_API_URL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

interface SarvamChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SarvamResponse {
  choices: {
    message: {
      role: string;
      content: string | null;
      reasoning_content?: string | null;
    };
    finish_reason: string;
  }[];
}

/**
 * Send a chat completion request to Sarvam AI.
 */
export async function chatCompletion(
  messages: SarvamChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    enableThinking?: boolean;
  } = {}
): Promise<string> {
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not configured');
  }

  const { temperature = 0.7, maxTokens = 4096, model = 'sarvam-105b', enableThinking = true } = options;

  const requestBody: any = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // Disable reasoning/thinking mode for structured output (JSON) to prevent
  // the model from consuming all tokens on internal chain-of-thought
  if (!enableThinking) {
    requestBody.chat_template_kwargs = { enable_thinking: false };
  }

  const response = await fetch(`${SARVAM_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SARVAM_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam AI error (${response.status}): ${errorText}`);
  }

  const data: SarvamResponse = await response.json();
  const choice = data.choices[0];
  
  // Primary: use content if available
  if (choice?.message?.content) {
    // Sometimes reasoning models wrap thinking in <think>...</think> tags within content
    let content = choice.message.content;
    const thinkEnd = content.indexOf('</think>');
    if (thinkEnd !== -1) {
      content = content.slice(thinkEnd + 8).trim();
    }
    return content;
  }
  
  // Fallback: if content is null (reasoning model exhausted tokens on thinking),
  // try to extract useful content from reasoning_content
  if (choice?.message?.reasoning_content) {
    console.warn('[Sarvam AI] content was null, attempting to extract from reasoning_content');
    const reasoning = choice.message.reasoning_content;
    // Look for JSON arrays/objects in reasoning (common for structured output prompts)
    const jsonMatch = reasoning.match(/(\[[\s\S]*\])\s*$/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    // Otherwise return the last substantial paragraph of reasoning as a fallback
    const paragraphs = reasoning.split('\n\n').filter(p => p.trim().length > 20);
    if (paragraphs.length > 0) {
      return paragraphs[paragraphs.length - 1].trim();
    }
  }
  
  return '';
}

/**
 * Send a streaming chat completion request to Sarvam AI.
 * Returns an async generator that yields content chunks.
 */
export async function* chatCompletionStream(
  messages: SarvamChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  } = {}
): AsyncGenerator<string> {
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not configured');
  }

  const { temperature = 0.7, maxTokens = 4096, model = 'sarvam-105b' } = options;

  const response = await fetch(`${SARVAM_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SARVAM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam AI error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body from Sarvam AI');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}
