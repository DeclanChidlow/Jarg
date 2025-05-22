import streamOpenAI from "./models/OpenAI.js";
import streamAnthropic from "./models/Anthropic.js";
import streamGoogle from "./models/Google.js";
import streamDeepSeek from "./models/DeepSeek.js";
import streamOllama from "./models/Ollama.js";

const providerSelect = document.getElementById("provider-select");
const configPanels = document.querySelectorAll(".model-config");

providerSelect.addEventListener("change", () => {
	configPanels.forEach((panel) => panel.classList.remove("active"));
	const selectedConfig = document.getElementById(`${providerSelect.value}-config`);
	if (selectedConfig) {
		selectedConfig.classList.add("active");
	}
});

const messagesContainer = document.getElementById("messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

function createMessageElement(isUser) {
	const messageDiv = document.createElement("div");
	messageDiv.className = `message ${isUser ? "user" : "assistant"}`;
	messagesContainer.appendChild(messageDiv);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
	return messageDiv;
}

export function updateMessageContent(messageElement, content, done = false) {
	const existingIndicator = messageElement.querySelector(".streaming-indicator");
	if (existingIndicator) {
		existingIndicator.remove();
	}

	messageElement.innerHTML = marked.parse(content);

	if (!done) {
		const indicator = document.createElement("span");
		indicator.className = "streaming-indicator";
		indicator.textContent = "▋";
		messageElement.appendChild(indicator);
	}

	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
	const message = userInput.value.trim();
	if (!message) return;

	userInput.disabled = true;
	sendButton.disabled = true;

	const userMessageElement = createMessageElement(true);
	updateMessageContent(userMessageElement, message, true);
	userInput.value = "";

	const assistantMessageElement = createMessageElement(false);
	updateMessageContent(assistantMessageElement, "", false);

	try {
		await streamResponse(message, assistantMessageElement);
	} catch (error) {
		const errorMessageElement = createMessageElement(false);
		errorMessageElement.classList.add("error");
		updateMessageContent(errorMessageElement, `Error: ${error.message}`, true);
		assistantMessageElement.remove();
	}

	userInput.disabled = false;
	sendButton.disabled = false;
	userInput.focus();
}

async function streamResponse(message, messageElement) {
	const model = providerSelect.value;
	let response;

	switch (model) {
		case "openai":
			response = streamOpenAI(message, messageElement);
			break;
		case "anthropic":
			response = streamAnthropic(message, messageElement);
			break;
		case "google":
			response = streamGoogle(message, messageElement);
			break;
		case "deepseek":
			response = streamDeepSeek(message, messageElement);
			break;
		case "ollama":
			response = streamOllama(message, messageElement);
			break;
		default:
			messageElement.classList.add("error");
			throw new Error("Please select a model first");
	}

	await response;
}

sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
});
