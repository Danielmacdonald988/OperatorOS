import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || 'default_key',
});

export interface GeneratedAgent {
  code: string;
  name: string;
  description: string;
  dependencies: string[];
}

export async function generateAgentCode(prompt: string): Promise<GeneratedAgent> {
  const systemPrompt = `You are an expert Python developer specializing in creating autonomous agents. Given a user prompt, generate a complete Python script that fulfills the requirements.

Rules:
1. Always create a complete, runnable Python script
2. Include proper error handling and logging
3. Use standard libraries when possible
4. If external APIs are needed, use environment variables for keys
5. Create a main() function that can be called
6. Include docstrings and comments
7. Return JSON with: code, name, description, dependencies

The script should be production-ready and handle edge cases appropriately.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    // If not JSON, extract code and create structure
    const codeMatch = content.match(/```python\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : content;
    
    // Extract name from prompt or code
    const nameMatch = prompt.match(/create (?:a |an )?([\w\s-]+)/i);
    const name = nameMatch ? nameMatch[1].toLowerCase().replace(/\s+/g, '-') : 'generated-agent';
    
    return {
      code,
      name,
      description: `Agent generated from: ${prompt.substring(0, 100)}...`,
      dependencies: ['requests', 'json', 'os', 'logging']
    };
  }
}

export async function fixAgentCode(code: string, error: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a Python debugging expert. Fix the provided code based on the error message. Return only the corrected code.'
      },
      {
        role: 'user',
        content: `Fix this Python code:\n\nCode:\n${code}\n\nError:\n${error}`
      }
    ],
    temperature: 0.1,
    max_tokens: 3000,
  });

  const fixedCode = response.choices[0]?.message?.content?.replace(/```python\n?/, '').replace(/\n?```$/, '');
  return fixedCode || code;
}
