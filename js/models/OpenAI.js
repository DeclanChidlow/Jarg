import { updateMessageContent } from "../main.js";

function getOpenAIConfig() {
	const apiKey = document.getElementById("openai-key").value;
	const model = document.getElementById("openai-model").value;

	if (!apiKey) {
		throw new Error("OpenAI API key is required");
	}

	// Get advanced parameters with their default values
	const temperature = parseFloat(document.getElementById("openai-temperature").value) || 1;
	const maxTokens = parseInt(document.getElementById("openai-maxTokens").value) || 3000;
	const topP = parseFloat(document.getElementById("openai-topP").value) || 1;
	const frequencyPenalty = parseFloat(document.getElementById("openai-frequencyPenalty").value) || 0;
	const presencePenalty = parseFloat(document.getElementById("openai-presencePenalty").value) || 0;

	return {
		apiKey,
		model,
		temperature,
		maxTokens,
		topP,
		frequencyPenalty,
		presencePenalty,
	};
}

async function streamOpenAI(message, messageElement) {
	try {
		const config = getOpenAIConfig();
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${config.apiKey}`,
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
				top_p: config.topP,
				frequency_penalty: config.frequencyPenalty,
				presence_penalty: config.presencePenalty,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || "OpenAI API error");
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
						const content = parsed.choices[0]?.delta?.content || "";
						currentContent += content;
						updateMessageContent(messageElement, currentContent);
					} catch (e) {
						console.error("Error parsing SSE data:", e);
					}
				}
			}
		}
	} catch (error) {
		throw new Error(`OpenAI API Error: ${error.message}`);
	}
}

export { streamOpenAI as default };
