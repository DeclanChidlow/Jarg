import { updateMessageContent } from "../main.js";

async function streamOllama(message, messageElement) {
	const url = document.getElementById("ollama-url").value;
	const model = document.getElementById("ollama-model").value;
	const settings = document.getElementById("ollama-settings").value;

	const finalMessage = settings ? `${settings} ${message}` : message;

	if (!url) throw new Error("Please enter an Ollama URL");

	const response = await fetch(`${url}/api/generate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: model,
			prompt: finalMessage,
			stream: true,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Ollama API error");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let currentContent = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			updateMessageContent(messageElement, currentContent, true);
			break;
		}

		const chunk = decoder.decode(value);
		const lines = chunk.split("\n");

		for (const line of lines) {
			if (!line.trim()) continue;

			try {
				const response = JSON.parse(line);
				currentContent += response.response;
				updateMessageContent(messageElement, currentContent);

				if (response.done) {
					updateMessageContent(messageElement, currentContent, true);
					return;
				}
			} catch (e) {
				console.error("Error parsing Ollama response:", e);
			}
		}
	}
}

async function loadOllamaModels() {
	const url = document.getElementById("ollama-url").value;
	const modelSelect = document.getElementById("ollama-model");

	try {
		const response = await fetch(`${url}/api/tags`);
		if (!response.ok) throw new Error("Failed to fetch models");

		const data = await response.json();

		modelSelect.innerHTML = "";

		data.models.forEach((model) => {
			const option = document.createElement("option");
			option.value = model.name;
			option.textContent = model.name;
			modelSelect.appendChild(option);
		});
	} catch (error) {
		console.error("Error loading Ollama models:", error);
	}
}

const initOllamaConfig = () => {
	const urlInput = document.getElementById("ollama-url");
	if (urlInput) {
		urlInput.addEventListener("change", loadOllamaModels);
		urlInput.addEventListener("blur", loadOllamaModels);
		loadOllamaModels();
	} else {
		setTimeout(initOllamaConfig, 100);
	}
};

initOllamaConfig();

export { streamOllama as default, loadOllamaModels };
