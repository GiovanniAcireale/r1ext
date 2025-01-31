const vscode = require('vscode');
const { spawn } = require('child_process');

/**
 * Runs `ollama generate -m <model> <prompt>` as a child process
 * @param {string} model - e.g. "deepseek-r1:latest"
 * @param {string} prompt - The user’s input
 */
function runOllama(model, prompt) {
  return new Promise((resolve, reject) => {
    let outputData = '';

    // IMPORTANT: If you're on Windows and `ollama` isn't in your PATH,
    // you might need the full path. e.g. 'C:\\path\\to\\ollama.exe'
    const child = spawn('ollama', ['generate', '-m', model, prompt]);

    // Log any standard output
    child.stdout.on('data', (data) => {
      console.log('[ollama stdout]:', data.toString());
      outputData += data.toString();
    });

    // Log any standard errors (this is crucial!)
    child.stderr.on('data', (data) => {
      console.error('[ollama stderr]:', data.toString());
    });

    // If spawning the process itself fails (like command not found)
    child.on('error', (err) => {
      console.error('[ollama spawn error]:', err);
      reject(err);
    });

    // When the command finishes, check the exit code
    child.on('close', (code) => {
      console.log('[ollama close] exited with code:', code);
      if (code === 0) {
        // Success
        resolve(outputData.trim());
      } else {
        reject(new Error(`ollama exited with code: ${code}`));
      }
    });
  });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // This only shows once when your extension is activated
  console.log('r1ext is now active!');

  // Register a command in package.json under contributes.commands
  const disposable = vscode.commands.registerCommand('r1ext.helloWorld', () => {
    // Quick “Hello World” message
    vscode.window.showInformationMessage('Hello World from r1Extension!');

    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
      'deepSeek',
      'DeepSeek Chat',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    // Load the HTML content
    panel.webview.html = getWebviewContent();

    // Listen for messages from webview
    panel.webview.onDidReceiveMessage(async (message) => {
      try {
        console.log('[Extension] Received message from webview:', message.message);

        // Attempt to generate text via Ollama
        const response = await runOllama('deepseek-r1:latest', message.message);

        console.log('[Extension] Ollama response:', response);

        // Send the generated response back to the webview
        panel.webview.postMessage({ message: response });
      } catch (error) {
        // This block is triggered if runOllama threw an error
        console.error('[Extension] Error in Ollama request:', error);
        panel.webview.postMessage({ message: 'Error processing your request.' });
      }
    });
  });

  context.subscriptions.push(disposable);
}

/**
 * Provide the HTML with a textarea, a Send button, and a place to show responses.
 */
function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 1rem; }
        #prompt { width: 100%; box-sizing: border-box; }
        #response { border: 1px solid #ccc; padding: 0.5rem; margin-top: 1rem; max-height: 400px; overflow-y: auto; }
      </style>
    </head>
    <body>
      <h2>DeepSeek Chat</h2>
      <textarea id="prompt" rows="4" placeholder="Type your message..."></textarea><br />
      <button onclick="send()">Send</button>
      <div id="response"></div>
      <script>
        const vscode = acquireVsCodeApi();
        const prompt = document.getElementById('prompt');
        const responseDiv = document.getElementById('response');

        function send() {
          const userInput = prompt.value;
          if (!userInput) return;
          vscode.postMessage({ message: userInput });
          responseDiv.innerHTML += '<p><strong>You:</strong> ' + userInput + '</p>';
          prompt.value = '';
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
          const msg = event.data.message;
          responseDiv.innerHTML += '<p><strong>DeepSeek:</strong> ' + msg + '</p>';
        });
      </script>
    </body>
    </html>
  `;
}

// Deactivate if needed
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
