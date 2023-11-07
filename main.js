const OpenAI = require("openai");

document.addEventListener("DOMContentLoaded", function() {
	const apiKeyInput = document.getElementById("apiKeyInput");
	const modelSelect = document.getElementById("modelSelect");
	const messageInput = document.getElementById("messageInput");
	const chatLog = document.getElementById("chat-log");
	const temperatureInput = document.getElementById("temperatureInput");
	const maxTokensInput = document.getElementById("maxTokensInput");

	const loginDiv = document.getElementById("login");
	const appDiv = document.getElementById("app");

	// Check if the API key is already stored in a cookie when the page loads
	const storedApiKey = getCookie("openaiApiKey");

	if (storedApiKey) {
		// API key is saved, show the app div
		appDiv.style.display = "flex";
		// Set the API key input field to the stored value
		apiKeyInput.value = storedApiKey;
	} else {
		// API key is not saved, show the login div
		loginDiv.style.display = "block";
	}

	document.getElementById("saveButton").addEventListener("click", () => {
		const apiKey = apiKeyInput.value;

		if (!apiKey) {
			alert("API key is required to proceed.");
			return;
		}

		// Store the API key in a cookie
		setCookie("openaiApiKey", apiKey, 365); // Cookie expires in 365 days
		alert("API key saved!");

		// Hide the login div and show the app div
		loginDiv.style.display = "none";
		appDiv.style.display = "flex";
	});

	async function sendMessage(userMessage) {
		const apiKey = apiKeyInput.value;

		if (!apiKey) {
			alert("Please save your OpenAI API key first.");
			return;
		}

		const selectedModel = modelSelect.value;
		const temperature = parseFloat(temperatureInput.value);
		const maxTokens = parseInt(maxTokensInput.value);

		const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: "You are a helpful assistant." },
				{ role: "user", content: userMessage },
			],
			model: selectedModel,
			temperature: temperature,
			max_tokens: maxTokens,
		});

		return completion.choices[0].message.content;
	}

	document.getElementById("sendMessageButton").addEventListener("click", async () => {
		const userMessage = messageInput.value;

		if (!userMessage) {
			alert("Please enter a message to send.");
			return;
		}

		const assistantResponse = await sendMessage(userMessage);

		// Display user message and assistant response
		const userMessageElement = document.createElement("p");
		userMessageElement.textContent = "You: " + userMessage;
		const assistantMessageElement = document.createElement("p");
		assistantMessageElement.textContent = "Assistant: " + assistantResponse;

		chatLog.appendChild(userMessageElement);
		chatLog.appendChild(assistantMessageElement);

		// Clear the input field
		messageInput.value = "";
	});

	// Function to set a cookie
	function setCookie(name, value, days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		const expires = "expires=" + date.toUTCString();
		document.cookie = name + "=" + value + "; " + expires;
	}

	// Function to get a cookie
	function getCookie(name) {
		const cookieName = name + "=";
		const cookies = document.cookie.split(";");
		for (let i = 0; i < cookies.length; i++) {
			let cookie = cookies[i].trim();
			if (cookie.indexOf(cookieName) === 0) {
				return cookie.substring(cookieName.length, cookie.length);
			}
		}
		return "";
	}
});
