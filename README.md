# gpt-translate-proxy
The backend proxy to keep my OpenAi key safe.

# GPT Translation Proxy for Circle.so

This is a lightweight, serverless backend proxy that connects a frontend language switcher (e.g. on Circle.so) to the OpenAI API for dynamic translation.

It receives a prompt like:
> "Translate to Italian: Hello, how are you?"

…and returns the GPT-generated translation to the browser.

## 🛠️ How It Works

- Receives POST requests at `/translate`
- Forwards the prompt to OpenAI using `gpt-4o`
- Returns only the translated string to the frontend
- Runs securely on [Vercel](https://vercel.com)

## 📁 Project Structure

