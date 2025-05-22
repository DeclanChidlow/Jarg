import { updateMessageContent } from "../main.js";

function getAnthropicConfig() {
	const apiKey = document.getElementById("anthropic-key").value;
	const model = document.getElementById("claude-model").value;

	if (!apiKey) {
		throw new Error("Please enter your Anthropic API key");
	}

	const temperature = parseFloat(document.getElementById("anthropic-temperature").value) || 1;
	const maxTokens = parseInt(document.getElementById("anthropic-maxTokens").value) || 3000;
	const topK = parseInt(document.getElementById("anthropic-topK").value) || 3000;
	const topP = parseInt(document.getElementById("anthropic-topP").value) || 3000;

	return {
		apiKey,
		model,
		temperature,
		maxTokens,
		topK,
		topP,
	};
}

async function streamAnthropic(message, messageElement) {
	try {
		const config = getAnthropicConfig();
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": config.apiKey,
				"anthropic-version": "2023-06-01",
				"anthropic-dangerous-direct-browser-access": true,
			},
			body: JSON.stringify({
				model: config.model,
				messages: [
					{
						role: "user",
						content: message,
					},
				],
				stream: true,
				temperature: config.temperature,
				max_tokens: config.maxTokens,
				top_k: config.topK,
				top_p: config.topP,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || "Anthropic API error");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let currentContent = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				updateMessageContent(messageElement, currentContent, true);
				break;
			}

			buffer += decoder.decode(value);
			const lines = buffer.split("\n");
			buffer = lines.pop();

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					const data = line.slice(6);
					if (data === "[DONE]") continue;

					try {
						const parsed = JSON.parse(data);
						const content = parsed.delta?.text || "";
						currentContent += content;
						updateMessageContent(messageElement, currentContent);
					} catch (e) {
						console.error("Error parsing SSE data:", e);
					}
				}
			}
		}
	} catch (error) {
		throw new Error(`Anthropic API Error: ${error.message}`);
	}
}

export { streamAnthropic as default };
