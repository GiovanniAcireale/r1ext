const vscode = require('vscode');
const { spawn } = require('child_process');

/**
 * Spawns `ollama run <model>` and writes `prompt` to stdin.
 * Streams each line of Ollama's response via a callback.
 * 
 * @param {string} model - e.g. "deepseek-r1:7b"
 * @param {string} prompt - The user’s input
 * @param {function} onLine - Callback for each line of output
 */
function runOllamaStream(model, prompt, onLine) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const child = spawn('ollama', ['run', model]);

    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      buffer += chunk;

      let lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        onLine(line);
      }
    });

    child.stderr.on('data', (data) => {
      console.error('[ollama stderr]:', data.toString());
    });

    child.on('error', (err) => {
      console.error('[ollama spawn error]:', err);
      reject(err);
    });

    child.on('close', (code) => {
      console.log('[ollama close] exited with code:', code);

      if (buffer.trim()) {
        onLine(buffer);
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ollama exited with code: ${code}`));
      }
    });

    child.stdin.write(prompt + '\n');
    child.stdin.end();
  });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('r1ext is now active!');

  // Note the new command ID: 'r1ext.askR1'
  const disposable = vscode.commands.registerCommand('r1ext.askR1', () => {
    vscode.window.showInformationMessage('Ask r1 command initialized!');

    const panel = vscode.window.createWebviewPanel(
      'deepSeek',
      'DeepSeek Chat',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message) => {
      const userPrompt = message.message.trim();
      if (!userPrompt) return;

      try {
        panel.webview.postMessage({ event: 'start-stream' });

        await runOllamaStream('deepseek-r1:7b', userPrompt, (line) => {
          panel.webview.postMessage({ event: 'partial', text: line });
        });

        panel.webview.postMessage({ event: 'done' });
      } catch (error) {
        console.error('[Extension] Error in Ollama request:', error);
        panel.webview.postMessage({ event: 'error', text: 'Error processing your request.' });
      }
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: Consolas, "Segoe UI", Tahoma, sans-serif;
          margin: 1rem;
        }
        h2 {
          color: #dcdcaa;
        }
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 80vh;
        }
        #prompt {
          background: #252526;
          color: #d4d4d4;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
        }
        button {
          background: #0e639c;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.95rem;
          margin-bottom: 1rem;
        }
        button:hover {
          background: #1177bb;
        }
        #response {
          background: #252526;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          padding: 0.5rem;
          max-height: 100%;
          overflow-y: auto;
          flex: 1;
        }
        .message {
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        .message strong {
          color: #4ec9b0;
        }
        .thinking {
          font-style: italic;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="chat-container">
        <h2>DeepSeek-r1</h2>
        <textarea id="prompt" rows="4" placeholder="Type your message..."></textarea>
        <button onclick="send()">Send</button>
        <div id="response"></div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const promptField = document.getElementById('prompt');
        const responseDiv = document.getElementById('response');

        function send() {
          const userInput = promptField.value.trim();
          if (!userInput) return;

          responseDiv.innerHTML += '<p class="message"><strong>You:</strong> ' + userInput + '</p>';
          scrollToBottom();

          vscode.postMessage({ message: userInput });
          promptField.value = '';
        }

        window.addEventListener('message', event => {
          const { event: evtType, text } = event.data;

          switch (evtType) {
            case 'start-stream':
              responseDiv.innerHTML += '<p class="message thinking">Thinking...</p>';
              scrollToBottom();
              break;
            case 'partial':
              const thinkingNodes = responseDiv.querySelectorAll('.thinking');
              thinkingNodes.forEach(node => node.remove());
              responseDiv.innerHTML += '<p class="message">' + text + '</p>';
              scrollToBottom();
              break;
            case 'done':
              break;
            case 'error':
              responseDiv.innerHTML += '<p class="message"><strong>Error:</strong> ' + text + '</p>';
              scrollToBottom();
              break;
            default:
              break;
          }
        });

        function scrollToBottom() {
          responseDiv.scrollTop = responseDiv.scrollHeight;
        }
      </script>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
