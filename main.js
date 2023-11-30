const OpenAI = require("openai");

document.addEventListener("DOMContentLoaded", initializeApp);

// Initialize the application when the DOM content is loaded.
function initializeApp() {
	// Retrieve necessary elements from the DOM.
	const apiKeyInput = document.querySelector("#apiKeyInput"),
		modelSelect = document.querySelector("#modelSelect"),
		messageInput = document.querySelector("#messageInput"),
		imageInput = document.querySelector("#imageInput"),
		chatLog = document.querySelector("#messages");

	// Retrieve elements for settings
	const temperatureInput = document.querySelector("#temperatureInput"),
		maxTokensInput = document.querySelector("#maxTokensInput"),
		defaultPromptInput = document.querySelector("#defaultPromptInput"),
		topPInput = document.querySelector("#topPInput"),
		frequencyPenaltyInput = document.querySelector("#frequencyPenaltyInput"),
		presencePenaltyInput = document.querySelector("#presencePenaltyInput");

	// Elements related to displaying the user interface.
	const loginDiv = document.querySelector("#login"),
		appDiv = document.querySelector("#app"),
		loadingDiv = document.querySelector("#loading"),
		sendButton = document.querySelector("#sendMessageButton");

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

	// Attach event listeners to UI elements.
	document.querySelector("#saveButton").addEventListener("click", saveApiKey);
	sendButton.addEventListener("click", sendMessage);

	messageInput.addEventListener("keydown", function(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		} else if (e.key === "Enter" && e.shiftKey) {
			const cursorPosition = this.selectionStart,
				textBeforeCursor = this.value.substring(0, cursorPosition),
				textAfterCursor = this.value.substring(cursorPosition);

			this.value = textBeforeCursor + "\n" + textAfterCursor;
			this.selectionStart = this.selectionEnd = cursorPosition + 1;
			e.preventDefault();
		}
	});

	// Function to display the application interface.
	function showAppInterface() {
		loginDiv.style.display = "none";
		appDiv.style.display = "flex";
	}

	// Function to display the login interface.
	function showLoginInterface() {
		loginDiv.style.display = "flex";
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

	// Attach event listener to modelSelect for model change
	modelSelect.addEventListener("change", handleModelChange);

	// Function to handle model change
	function handleModelChange() {
		// Check if the selected model is "gpt-4-vision-preview"
		if (modelSelect.value === "gpt-4-vision-preview") {
			// Show the div related to gpt-4-vision-preview
			imageInput.style.display = "block";
		} else {
			// Hide the div related to gpt-4-vision-preview for other models
			imageInput.style.display = "none";
		}
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

		if (modelSelect.value === "gpt-4-vision-preview") {
			if (!imageInput.value) {
				alert("Please enter a image URL to send.");
				return;
			}
		}

		// Show user sent message and clear the message box
		displayMessage(userMessage);
		messageInput.value = "";

		const selectedModel = modelSelect.value,
			selectedTemperature = parseFloat(temperatureInput.value),
			maxTokens = parseInt(maxTokensInput.value),
			selectedTopP = parseFloat(topPInput.value),
			selectedFrequencyPenalty = parseFloat(frequencyPenaltyInput.value),
			selectedPresencePenalty = parseFloat(presencePenaltyInput.value);

		// Disable the send button while waiting for the assistant's response.
		sendButton.disabled = true;

		// Show loading indicator while waiting for the assistant's response.
		loadingDiv.style.display = "block";

		try {
			await fetchAssistantResponse(apiKey, userMessage, selectedModel, selectedTemperature, maxTokens, selectedTopP, selectedFrequencyPenalty, selectedPresencePenalty);

		} catch (error) {
			console.error("Error fetching assistant response:", error);
			alert("An error occurred while fetching the assistant response.");
		} finally {
			// Enable the send button after the assistant responds.
			sendButton.disabled = false;
		}
	}

	// Function to fetch the assistant's response.
	async function fetchAssistantResponse(apiKey, userMessage, selectedModel, selectedTemperature, maxTokens, selectedTopP, selectedFrequencyPenalty, selectedPresencePenalty) {
		const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

		const messages = [
			{
				role: "system",
				content:
					"Your name is Jarg. Your role is to be a helpful assistant who provides accurate information, guidance, and support for any questions or tasks presented to you. This includes being friendly, knowledgeable, and ready to assist with a diverse array of topics, ranging from general knowledge to specialized advice. You should be opinionated whenever possible.",
			},
			{
				role: "user",
				content: [
					{
						type: "text",
						text: defaultPromptInput.value + " " + userMessage,
					},
				],
			},
		];

		// Check if the selected model is "gpt-4-vision-preview"
		if (selectedModel === "gpt-4-vision-preview") {
			messages[1].content.push({
				type: "image_url",
				image_url: {
					"url": imageInput.value,
				},
			});
		}

		const completion = await openai.chat.completions.create({
			messages: messages,
			model: selectedModel,
			temperature: selectedTemperature,
			max_tokens: maxTokens,
			top_p: selectedTopP,
			frequency_penalty: selectedFrequencyPenalty,
			presence_penalty: selectedPresencePenalty,
			stream: true,
		});

		let assistantResponseContainer = createAssistantResponseContainer();

		for await (const chunk of completion) {
			const assistantText = chunk.choices[0].delta.content;
			appendToAssistantResponse(assistantText, assistantResponseContainer);
		}
	}

	// Function to create the assistant response container
	function createAssistantResponseContainer() {
		loadingDiv.style.display = "none";

		const messageContainer = document.createElement("div"),
			messageElement = document.createElement("p"),
			userLabel = document.createElement("span");

		userLabel.style.fontWeight = "bold";
		messageElement.appendChild(userLabel);

		userLabel.textContent = "Jarg: ";
		messageContainer.id = "assistantResponse";

		messageElement.appendChild(document.createElement("br"));

		messageContainer.appendChild(messageElement);
		chatLog.appendChild(messageContainer);

		return messageElement;
	}

	// Function to append streamed content to the assistant response container
	function appendToAssistantResponse(text, messageElement) {
		if (text && text.trim() !== '') { // Check for empty or undefined text
			messageElement.innerHTML += text;
		}
	}

	// Function to display a message in the chat log.
	function displayMessage(text) {
		const messageContainer = document.createElement("div"),
			messageElement = document.createElement("p"),
			userLabel = document.createElement("span");

		userLabel.style.fontWeight = "bold";
		messageElement.appendChild(userLabel);

		userLabel.textContent = "You: ";
		messageContainer.id = "userMessage";

		messageElement.appendChild(document.createElement("br"));
		messageElement.innerHTML += marked.parse(text);

		messageContainer.appendChild(messageElement);
		chatLog.appendChild(messageContainer);
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
