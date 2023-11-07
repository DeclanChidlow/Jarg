const OpenAI = require("openai");

document.addEventListener("DOMContentLoaded", initializeApp);

// Initialize the application when the DOM content is loaded.
function initializeApp() {
	// Retrieve necessary elements from the DOM.
	const apiKeyInput = document.querySelector("#apiKeyInput");
	const modelSelect = document.querySelector("#modelSelect");
	const messageInput = document.querySelector("#messageInput");
	const chatLog = document.querySelector("#messages");
	const temperatureInput = document.querySelector("#temperatureInput");
	const maxTokensInput = document.querySelector("#maxTokensInput");

	// Elements related to the user interface.
	const loginDiv = document.querySelector("#login");
	const appDiv = document.querySelector("#app");
	const loadingDiv = document.querySelector("#loading");

	// Check if the API key is stored in a cookie when the page loads.
	const storedApiKey = getCookie("openaiApiKey");

	if (storedApiKey) {
		// The API key is saved; show the application interface.
		showAppInterface();
		apiKeyInput.value = storedApiKey;
	} else {
		// The API key is not saved; show the login interface.
		showLoginInterface();
	}

	// Elements related to the user interface.
	const sendButton = document.querySelector("#sendMessageButton");

	// Attach event listeners to UI elements.
	document.querySelector("#saveButton").addEventListener("click", saveApiKey);
	sendButton.addEventListener("click", sendMessage);

	// Function to display the application interface.
	function showAppInterface() {
		loginDiv.style.display = "none";
		appDiv.style.display = "flex";
	}

	// Function to display the login interface.
	function showLoginInterface() {
		loginDiv.style.display = "block";
	}

	// Function to save the API key to a cookie.
	function saveApiKey() {
		const apiKey = apiKeyInput.value;

		if (!apiKey) {
			alert("API key is required to proceed.");
			return;
		}

		setCookie("openaiApiKey", apiKey, 365); // Cookie expires in 365 days.
		alert("API key saved!");
		showAppInterface();
	}

	// Function to send a message to the assistant.
	async function sendMessage() {
		const apiKey = apiKeyInput.value;

		if (!apiKey) {
			alert("Please save your OpenAI API key first.");
			return;
		}

		const userMessage = messageInput.value;
		if (!userMessage) {
			alert("Please enter a message to send.");
			return;
		}

		// Show user sent message and clear the message box
		displayMessage("You: " + marked.parse(userMessage));
		messageInput.value = "";

		const selectedModel = modelSelect.value;
		const temperature = parseFloat(temperatureInput.value);
		const maxTokens = parseInt(maxTokensInput.value);

		// Disable the send button while waiting for the assistant's response.
		sendButton.disabled = true;

		// Show loading indicator while waiting for the assistant's response.
		loadingDiv.style.display = "block";

		try {
			const assistantResponse = await fetchAssistantResponse(apiKey, userMessage, selectedModel, temperature, maxTokens);

			// Display the assistant's message in the chat log.
			displayMessage("Jarg: " + marked.parse(assistantResponse));

		} catch (error) {
			console.error("Error fetching assistant response:", error);
			alert("An error occurred while fetching the assistant response.");
		} finally {
			// Enable the send button and hide the loading indicator after the assistant responds.
			sendButton.disabled = false;
			loadingDiv.style.display = "none";
		}
	}

	// Function to fetch the assistant's response.
	async function fetchAssistantResponse(apiKey, userMessage, selectedModel, temperature, maxTokens) {
		const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

		const completion = await openai.chat.completions.create({
			messages: [
				{
					role: "system",
					content:
						" Hello, AI! From now on, you will be known as Jarg. Your role is to be a helpful assistant who provides accurate information, guidance, and support for any questions or tasks presented to you. As Jarg, you should be friendly, knowledgeable, and ready to assist with a diverse array of topics, ranging from general knowledge to specialized advice. Remember to be patient and courteous at all times, ensuring that you deliver the best possible assistance. How can you assist today?",
				},
				{ role: "user", content: userMessage },
			],
			model: selectedModel,
			temperature: temperature,
			max_tokens: maxTokens,
		});

		return completion.choices[0].message.content;
	}

	// Function to display a message in the chat log.
	function displayMessage(text) {
		const messageElement = document.createElement("p");
		messageElement.innerHTML = text;
		chatLog.appendChild(messageElement);
	}

	// Function to set a cookie.
	function setCookie(name, value, days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		const expires = "expires=" + date.toUTCString();
		document.cookie = name + "=" + value + "; " + expires;
	}

	// Function to get a cookie.
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
}
