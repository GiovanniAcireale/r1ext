# r1ext README

**r1ext** is a Visual Studio Code extension that creates an **integrated chat interface** for interacting with a **local DeepSeek R1** model via the **Ollama** CLI. It listens for user prompts in a custom webview and streams the model’s responses back in real time.

## Features

- **In-Editor Chat**: Opens a dedicated panel (webview) where you can type questions or statements.
- **Local LLM Integration**: Uses the `ollama` command-line tool to run the `deepseek-r1:7b` (or another specified) model locally.
- **Streaming Output**: Displays generated text live, line by line, instead of waiting for the model to finish.
- **Dark-Themed UI**: Designed to blend in with VS Code’s dark color palette.

### How It Works

1. **Command Activation**: From the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`), run **“Ask r1”**.
2. **Enter Prompt**: Type your question/command in the text box, then click **Send**.
3. **View Response**: The model’s response streams back in real time, appearing in the lower panel.

*(Add a screenshot of your chat panel if you have one.)*

## Requirements

1. **Ollama** must be installed and available on your system’s PATH.  
   - [Ollama GitHub](https://github.com/jmorganca/ollama)
2. **DeepSeek R1 Model** (e.g. `deepseek-r1:7b`) must be accessible to Ollama.  
   - For example, `ollama run deepseek-r1:7b` should work in your terminal without error.
3. **VS Code 1.70+**.

## Extension Settings

Currently, **r1ext** does not introduce new settings. In future releases, you might see configuration options for:
- **Model Selection**: Switch between different local models.
- **Streaming Behavior**: Adjust how partial responses are displayed.

## Known Issues

- **Model Compatibility**: Older versions of Ollama may not support all flags, so this extension uses the interactive `ollama run <model>` approach. If you encounter unknown flags, update Ollama or switch to a model/command syntax your version supports.
- **Large Outputs**: Very lengthy responses may clutter the output box. Consider clearing it manually or restarting your chat session as needed.

## Release Notes

### 0.0.1
- Initial release with streaming chat interface to DeepSeek R1 via Ollama.

## For More Information

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy chatting with your local LLM!**