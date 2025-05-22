import { updateMessageContent } from "../main.js";

function getDeepSeekConfig() {
	const apiKey = document.getElementById("deepseek-key").value;
	const model = document.getElementById("deepseek-model").value;

	if (!apiKey) {
		throw new Error("DeepSeek API key is required");
	}

	const temperature = parseFloat(document.getElementById("deepseek-temperature").value) || 1;

	return {
		apiKey,
		model,
		temperature,
	};
}

async function streamDeepSeek(message, messageElement) {
	try {
		const config = getDeepSeekConfig();
		const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || "DeepSeek API error");
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
		throw new Error(`DeepSeek API Error: ${error.message}`);
	}
}

export { streamDeepSeek as default };
