# Azure AI Inference SDK for Java Acceptance Criteria

**SDK**: `com.azure:azure-ai-inference`
**Repository**: https://github.com/Azure/azure-sdk-for-java/tree/main/sdk/ai/azure-ai-inference
**Purpose**: Skill testing acceptance criteria for validating generated code correctness

---

## 1. Correct Import Patterns

### 1.1 Client Imports

#### ✅ CORRECT: Sync Clients
```java
import com.azure.ai.inference.ChatCompletionsClient;
import com.azure.ai.inference.ChatCompletionsClientBuilder;
import com.azure.ai.inference.EmbeddingsClient;
import com.azure.ai.inference.EmbeddingsClientBuilder;
```

#### ✅ CORRECT: Async Clients
```java
import com.azure.ai.inference.ChatCompletionsAsyncClient;
import com.azure.ai.inference.EmbeddingsAsyncClient;
```

#### ✅ CORRECT: Authentication
```java
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.core.credential.AzureKeyCredential;
```

### 1.2 Model Imports

#### ✅ CORRECT: Chat Request Messages
```java
import com.azure.ai.inference.models.ChatRequestMessage;
import com.azure.ai.inference.models.ChatRequestSystemMessage;
import com.azure.ai.inference.models.ChatRequestUserMessage;
import com.azure.ai.inference.models.ChatRequestAssistantMessage;
import com.azure.ai.inference.models.ChatRequestToolMessage;
```

#### ✅ CORRECT: Chat Response Models
```java
import com.azure.ai.inference.models.ChatCompletions;
import com.azure.ai.inference.models.ChatCompletionsOptions;
import com.azure.ai.inference.models.ChatChoice;
import com.azure.ai.inference.models.ChatResponseMessage;
```

#### ✅ CORRECT: Streaming Models
```java
import com.azure.ai.inference.models.StreamingChatCompletionsUpdate;
import com.azure.ai.inference.models.StreamingChatResponseMessageUpdate;
import com.azure.core.util.IterableStream;
```

#### ✅ CORRECT: Embeddings Models
```java
import com.azure.ai.inference.models.EmbeddingsResult;
import com.azure.ai.inference.models.EmbeddingItem;
```

#### ✅ CORRECT: Vision Models
```java
import com.azure.ai.inference.models.ChatMessageContentItem;
import com.azure.ai.inference.models.ChatMessageTextContentItem;
import com.azure.ai.inference.models.ChatMessageImageContentItem;
import com.azure.ai.inference.models.ChatMessageImageUrl;
```

### 1.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong import paths
```java
// WRONG - Models are not in main package
import com.azure.ai.inference.ChatCompletions;
import com.azure.ai.inference.ChatRequestMessage;

// WRONG - Using OpenAI SDK directly
import com.openai.OpenAIClient;
import com.openai.models.ChatCompletion;

// WRONG - Non-existent classes
import com.azure.ai.inference.models.CompletionRequest;
import com.azure.ai.inference.models.InferenceClient;
```

---

## 2. Client Creation Patterns

### 2.1 ✅ CORRECT: With API Key Credential
```java
String endpoint = System.getenv("AZURE_INFERENCE_ENDPOINT");
String key = System.getenv("AZURE_INFERENCE_CREDENTIAL");

ChatCompletionsClient client = new ChatCompletionsClientBuilder()
    .endpoint(endpoint)
    .credential(new AzureKeyCredential(key))
    .buildClient();
```

### 2.2 ✅ CORRECT: With DefaultAzureCredential (Recommended)
```java
ChatCompletionsClient client = new ChatCompletionsClientBuilder()
    .endpoint(System.getenv("AZURE_INFERENCE_ENDPOINT"))
    .credential(new DefaultAzureCredentialBuilder().build())
    .buildClient();
```

### 2.3 ✅ CORRECT: Async Client
```java
ChatCompletionsAsyncClient asyncClient = new ChatCompletionsClientBuilder()
    .endpoint(endpoint)
    .credential(new AzureKeyCredential(key))
    .buildAsyncClient();
```

### 2.4 ✅ CORRECT: Embeddings Client
```java
EmbeddingsClient embeddingsClient = new EmbeddingsClientBuilder()
    .endpoint(endpoint)
    .credential(new AzureKeyCredential(key))
    .buildClient();
```

### 2.5 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Hardcoded credentials
```java
// WRONG - hardcoded values
ChatCompletionsClient client = new ChatCompletionsClientBuilder()
    .endpoint("https://myresource.services.ai.azure.com/models")
    .credential(new AzureKeyCredential("sk-1234567890"))
    .buildClient();
```

#### ❌ INCORRECT: Missing endpoint
```java
// WRONG - endpoint is required
ChatCompletionsClient client = new ChatCompletionsClientBuilder()
    .credential(new AzureKeyCredential(key))
    .buildClient();
```

---

## 3. Chat Completions

### 3.1 ✅ CORRECT: Basic Chat Completion
```java
List<ChatRequestMessage> messages = new ArrayList<>();
messages.add(new ChatRequestSystemMessage("You are a helpful assistant."));
messages.add(new ChatRequestUserMessage("What is Azure AI?"));

ChatCompletions response = client.complete(new ChatCompletionsOptions(messages));

for (ChatChoice choice : response.getChoices()) {
    System.out.println(choice.getMessage().getContent());
}
```

### 3.2 ✅ CORRECT: Simple String Prompt
```java
ChatCompletions response = client.complete("Tell me a joke");
System.out.println(response.getChoice().getMessage().getContent());
```

### 3.3 ✅ CORRECT: With Options
```java
ChatCompletionsOptions options = new ChatCompletionsOptions(messages)
    .setTemperature(0.7)
    .setMaxTokens(1000)
    .setTopP(0.9);

ChatCompletions response = client.complete(options);
```

### 3.4 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong method names
```java
// WRONG - method is complete, not chat or createCompletion
client.chat(messages);
client.createCompletion(messages);
client.generate(messages);

// WRONG - Using OpenAI SDK patterns
client.chat().completions().create(messages);
```

---

## 4. Streaming Chat Completions

### 4.1 ✅ CORRECT: Stream with forEach
```java
List<ChatRequestMessage> messages = new ArrayList<>();
messages.add(new ChatRequestSystemMessage("You are a helpful assistant."));
messages.add(new ChatRequestUserMessage("Write a poem about Azure."));

client.completeStream(new ChatCompletionsOptions(messages))
    .forEach(update -> {
        if (!CoreUtils.isNullOrEmpty(update.getChoices())) {
            StreamingChatResponseMessageUpdate delta = update.getChoice().getDelta();
            if (delta.getContent() != null) {
                System.out.print(delta.getContent());
            }
        }
    });
```

### 4.2 ✅ CORRECT: Stream with IterableStream
```java
IterableStream<StreamingChatCompletionsUpdate> stream = 
    client.completeStream(new ChatCompletionsOptions(messages));

stream.stream().forEach(update -> {
    if (update.getChoice() != null && update.getChoice().getDelta() != null) {
        String content = update.getChoice().getDelta().getContent();
        if (content != null) {
            System.out.print(content);
        }
    }
});
```

### 4.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using non-streaming method for streaming
```java
// WRONG - complete() returns ChatCompletions, not a stream
for (ChatCompletions update : client.complete(options)) {
    System.out.println(update);
}
```

---

## 5. Embeddings

### 5.1 ✅ CORRECT: Generate Embeddings
```java
EmbeddingsClient embeddingsClient = new EmbeddingsClientBuilder()
    .endpoint(endpoint)
    .credential(new AzureKeyCredential(key))
    .buildClient();

List<String> input = List.of("Hello world", "Azure AI is great");
EmbeddingsResult result = embeddingsClient.embed(input);

for (EmbeddingItem item : result.getData()) {
    System.out.println("Index: " + item.getIndex());
    System.out.println("Dimensions: " + item.getEmbeddingList().size());
}
```

### 5.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong method name
```java
// WRONG - method is embed, not embeddings or createEmbedding
embeddingsClient.embeddings(input);
embeddingsClient.createEmbedding(input);
```

---

## 6. Vision (Image Analysis)

### 6.1 ✅ CORRECT: Image from URL
```java
List<ChatMessageContentItem> contentItems = new ArrayList<>();
contentItems.add(new ChatMessageTextContentItem("Describe this image."));
contentItems.add(new ChatMessageImageContentItem(
    new ChatMessageImageUrl("https://example.com/image.jpg")));

List<ChatRequestMessage> messages = new ArrayList<>();
messages.add(new ChatRequestSystemMessage("You are a helpful assistant."));
messages.add(ChatRequestUserMessage.fromContentItems(contentItems));

ChatCompletions response = client.complete(new ChatCompletionsOptions(messages));
System.out.println(response.getChoice().getMessage().getContent());
```

### 6.2 ✅ CORRECT: Image from Local File
```java
import java.nio.file.Path;
import java.nio.file.Paths;

Path imagePath = Paths.get("./images/sample.png");
String imageFormat = "png";

List<ChatMessageContentItem> contentItems = new ArrayList<>();
contentItems.add(new ChatMessageTextContentItem("What is in this image?"));
contentItems.add(new ChatMessageImageContentItem(imagePath, imageFormat));

List<ChatRequestMessage> messages = new ArrayList<>();
messages.add(ChatRequestUserMessage.fromContentItems(contentItems));

ChatCompletions response = client.complete(new ChatCompletionsOptions(messages));
```

### 6.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong image content construction
```java
// WRONG - URL must be wrapped in ChatMessageImageUrl
contentItems.add(new ChatMessageImageContentItem("https://example.com/image.jpg"));

// WRONG - Using base64 string directly
contentItems.add(new ChatMessageImageContentItem(base64String));
```

---

## 7. Model Information

### 7.1 ✅ CORRECT: Get Model Info
```java
ModelInfo modelInfo = client.getModelInfo();
System.out.println("Model: " + modelInfo.getModelName());
System.out.println("Provider: " + modelInfo.getModelProviderName());
System.out.println("Type: " + modelInfo.getModelType());
```

---

## 8. Error Handling

### 8.1 ✅ CORRECT: HTTP Exception Handling
```java
import com.azure.core.exception.HttpResponseException;

try {
    ChatCompletions response = client.complete(options);
    System.out.println(response.getChoice().getMessage().getContent());
} catch (HttpResponseException e) {
    System.err.println("HTTP Status: " + e.getResponse().getStatusCode());
    System.err.println("Error: " + e.getMessage());
}
```

### 8.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Empty catch blocks
```java
// WRONG - swallowing exceptions
try {
    client.complete(options);
} catch (Exception e) {
    // Do nothing
}
```

---

## 9. Best Practices Checklist

- [ ] Use `DefaultAzureCredentialBuilder` for production authentication
- [ ] Use environment variables for endpoint and credentials
- [ ] Use streaming for long responses to improve UX
- [ ] Specify model when endpoint serves multiple deployments
- [ ] Close async clients explicitly or use try-with-resources
- [ ] Handle rate limits with appropriate retry logic
- [ ] Use `CoreUtils.isNullOrEmpty()` to check for empty collections
