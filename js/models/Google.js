import { updateMessageContent } from "../main.js";

async function streamGoogle(message, messageElement) {
	const apiKey = document.getElementById("google-key").value;
	const model = document.getElementById("google-model").value;

	if (!apiKey) throw new Error("Please enter your Google API key");

	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			contents: [
				{
					parts: [
						{
							text: message,
						},
					],
				},
			],
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error?.message || "Gemini API error");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let currentContent = "";
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			updateMessageContent(messageElement, currentContent, true);
			break;
		}

		buffer += decoder.decode(value);

		// Split by newlines and process each chunk
		const lines = buffer.split("\n");
		buffer = lines.pop() || ""; // Keep the last incomplete chunk in buffer

		for (const line of lines) {
			if (!line.trim()) continue;

			try {
				const response = JSON.parse(line);
				if (response.candidates && response.candidates[0]?.content?.parts) {
					const text = response.candidates[0].content.parts[0]?.text || "";
					currentContent += text;
					updateMessageContent(messageElement, currentContent);
				}
			} catch (e) {
				// Skip invalid JSON chunks
				continue;
			}
		}
	}
}

export { streamGoogle as default };
