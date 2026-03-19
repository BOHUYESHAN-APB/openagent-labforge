# Azure.AI.Inference SDK Acceptance Criteria (.NET)

**SDK**: `Azure.AI.Inference`
**Repository**: https://github.com/Azure/azure-sdk-for-net/tree/main/sdk/ai/Azure.AI.Inference
**Package**: https://www.nuget.org/packages/Azure.AI.Inference
**Purpose**: Skill testing acceptance criteria for validating generated C# code correctness

---

## 1. Correct Using Statements

### 1.1 Core Imports

#### ✅ CORRECT: Basic Client Imports
```csharp
using Azure;
using Azure.AI.Inference;
using Azure.Identity;
```

#### ✅ CORRECT: Additional Types
```csharp
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
```

#### ✅ CORRECT: For Streaming
```csharp
using Azure.AI.Inference;
using System.Text;
```

#### ✅ CORRECT: For Dependency Injection (ASP.NET Core)
```csharp
using Azure.Identity;
using Azure.AI.Inference;
using Microsoft.Extensions.Azure;
```

### 1.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using OpenAI SDK namespaces
```csharp
// WRONG - This is Azure.AI.Inference, not Azure.AI.OpenAI
using Azure.AI.OpenAI;
using OpenAI;
using OpenAI.Chat;
```

#### ❌ INCORRECT: Non-existent namespaces
```csharp
// WRONG - These don't exist
using Azure.AI.Inference.Chat;
using Azure.AI.Inference.Embeddings;
using Azure.AI.Inference.Models;
```

---

## 2. Client Creation Patterns

### 2.1 ✅ CORRECT: ChatCompletionsClient with API Key
```csharp
var endpoint = new Uri(Environment.GetEnvironmentVariable("AZURE_AI_CHAT_ENDPOINT"));
var credential = new AzureKeyCredential(Environment.GetEnvironmentVariable("AZURE_AI_CHAT_KEY"));

var client = new ChatCompletionsClient(endpoint, credential, new AzureAIInferenceClientOptions());
```

### 2.2 ✅ CORRECT: ChatCompletionsClient with DefaultAzureCredential
```csharp
var endpoint = new Uri("https://<resource>.services.ai.azure.com/models");
var client = new ChatCompletionsClient(endpoint, new DefaultAzureCredential());
```

### 2.3 ✅ CORRECT: EmbeddingsClient
```csharp
var endpoint = new Uri(Environment.GetEnvironmentVariable("AZURE_AI_EMBEDDINGS_ENDPOINT"));
var credential = new AzureKeyCredential(Environment.GetEnvironmentVariable("AZURE_AI_EMBEDDINGS_KEY"));

var client = new EmbeddingsClient(endpoint, credential, new AzureAIInferenceClientOptions());
```

### 2.4 ✅ CORRECT: ImageEmbeddingsClient
```csharp
var endpoint = new Uri(Environment.GetEnvironmentVariable("AZURE_AI_EMBEDDINGS_ENDPOINT"));
var credential = new AzureKeyCredential(Environment.GetEnvironmentVariable("AZURE_AI_EMBEDDINGS_KEY"));

var client = new ImageEmbeddingsClient(endpoint, credential, new AzureAIInferenceClientOptions());
```

### 2.5 ✅ CORRECT: Dependency Injection Registration
```csharp
services.AddAzureClients(builder =>
{
    builder.AddChatCompletionsClient(new Uri("<endpoint>"));
    builder.UseCredential(new DefaultAzureCredential());
});
```

### 2.6 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Missing AzureAIInferenceClientOptions
```csharp
// WRONG - Should include AzureAIInferenceClientOptions for API key auth
var client = new ChatCompletionsClient(endpoint, credential);
```

#### ❌ INCORRECT: Wrong credential type
```csharp
// WRONG - Can't pass string directly
var client = new ChatCompletionsClient(endpoint, "my-api-key");
```

#### ❌ INCORRECT: Using AzureOpenAIClient
```csharp
// WRONG - This SDK uses ChatCompletionsClient, not AzureOpenAIClient
var client = new AzureOpenAIClient(endpoint, credential);
```

---

## 3. Chat Completions Patterns

### 3.1 ✅ CORRECT: Basic Chat Completion
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestSystemMessage("You are a helpful assistant."),
        new ChatRequestUserMessage("How many feet are in a mile?"),
    },
};

Response<ChatCompletions> response = client.Complete(requestOptions);
Console.WriteLine(response.Value.Content);
```

### 3.2 ✅ CORRECT: Async Chat Completion
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestSystemMessage("You are a helpful assistant."),
        new ChatRequestUserMessage("Hello!"),
    },
};

Response<ChatCompletions> response = await client.CompleteAsync(requestOptions);
Console.WriteLine(response.Value.Choices[0].Message.Content);
```

### 3.3 ✅ CORRECT: Streaming Chat Completion
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestSystemMessage("You are a helpful assistant."),
        new ChatRequestUserMessage("Write a poem about Azure."),
    },
};

StreamingResponse<StreamingChatCompletionsUpdate> response = 
    await client.CompleteStreamingAsync(requestOptions);

StringBuilder contentBuilder = new();
await foreach (StreamingChatCompletionsUpdate chatUpdate in response)
{
    if (!string.IsNullOrEmpty(chatUpdate.ContentUpdate))
    {
        contentBuilder.Append(chatUpdate.ContentUpdate);
    }
}

Console.WriteLine(contentBuilder.ToString());
```

### 3.4 ✅ CORRECT: Chat with Model Specification
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestSystemMessage("You are a helpful assistant."),
        new ChatRequestUserMessage("Hello!"),
    },
    Model = "gpt-4o-mini",  // Optional for single-model endpoints
};

Response<ChatCompletions> response = client.Complete(requestOptions);
```

### 3.5 ✅ CORRECT: Multi-modal Chat (Images)
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestSystemMessage("You are a helpful assistant that describes images."),
        new ChatRequestUserMessage(
            new ChatMessageTextContentItem("What's in this image?"),
            new ChatMessageImageContentItem(new Uri("https://example.com/image.jpg"))
        ),
    },
};

Response<ChatCompletions> response = client.Complete(requestOptions);
Console.WriteLine(response.Value.Choices[0].Message.Content);
```

### 3.6 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using old message types
```csharp
// WRONG - These types don't exist
var options = new ChatCompletionsOptions()
{
    Messages =
    {
        new SystemMessage("You are helpful"),  // Should be ChatRequestSystemMessage
        new UserMessage("Hello"),              // Should be ChatRequestUserMessage
    },
};
```

#### ❌ INCORRECT: Accessing content directly on response
```csharp
// WRONG - Must access through Choices[0].Message.Content or Value.Content
string content = response.Content;  // Wrong property path
```

#### ❌ INCORRECT: Using CreateChatCompletion method
```csharp
// WRONG - Method is called Complete or CompleteAsync
var response = client.CreateChatCompletion(options);
```

---

## 4. Function Calling / Tool Use Patterns

### 4.1 ✅ CORRECT: Define Function Tool
```csharp
var getWeatherTool = new ChatCompletionsFunctionToolDefinition(
    new FunctionDefinition("get_weather")
    {
        Description = "Get the weather in a location",
        Parameters = BinaryData.FromString("""
        {
            "type": "object",
            "properties": {
                "location": { "type": "string", "description": "The city and state" }
            },
            "required": ["location"]
        }
        """)
    });

var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestUserMessage("What's the weather in Seattle?"),
    },
    Tools = { getWeatherTool }
};
```

### 4.2 ✅ CORRECT: Handle Tool Calls
```csharp
Response<ChatCompletions> response = client.Complete(requestOptions);

var assistantMessage = response.Value.Choices[0].Message;
if (assistantMessage.ToolCalls?.Count > 0)
{
    foreach (var toolCall in assistantMessage.ToolCalls)
    {
        if (toolCall is ChatCompletionsFunctionToolCall functionCall)
        {
            // Execute the function and get result
            string result = ExecuteFunction(functionCall.Name, functionCall.Arguments);
            
            // Add assistant message and tool result
            requestOptions.Messages.Add(new ChatRequestAssistantMessage(assistantMessage));
            requestOptions.Messages.Add(new ChatRequestToolMessage(result, functionCall.Id));
        }
    }
    
    // Get final response
    response = client.Complete(requestOptions);
}
```

### 4.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong tool definition type
```csharp
// WRONG - Should use ChatCompletionsFunctionToolDefinition
var tool = new FunctionToolDefinition("get_weather", "Get weather", parameters);
```

#### ❌ INCORRECT: Not including tool call ID in response
```csharp
// WRONG - ChatRequestToolMessage requires the tool call ID
requestOptions.Messages.Add(new ChatRequestToolMessage(result));  // Missing ID
```

---

## 5. Embeddings Patterns

### 5.1 ✅ CORRECT: Basic Text Embeddings
```csharp
var input = new List<string> { "King", "Queen", "Jack", "Page" };
var requestOptions = new EmbeddingsOptions(input);

Response<EmbeddingsResult> response = client.Embed(requestOptions);

foreach (EmbeddingItem item in response.Value.Data)
{
    List<float> embedding = item.Embedding.ToObjectFromJson<List<float>>();
    Console.WriteLine($"Index: {item.Index}, Embedding length: {embedding.Count}");
}
```

### 5.2 ✅ CORRECT: Async Embeddings
```csharp
var input = new List<string> { "Hello world", "Goodbye world" };
var requestOptions = new EmbeddingsOptions(input);

Response<EmbeddingsResult> response = await client.EmbedAsync(requestOptions);
```

### 5.3 ✅ CORRECT: Image Embeddings
```csharp
var client = new ImageEmbeddingsClient(endpoint, credential, new AzureAIInferenceClientOptions());

var requestOptions = new ImageEmbeddingsOptions()
{
    Input = 
    {
        new ImageEmbeddingInput(new Uri("https://example.com/image.jpg")),
    }
};

Response<EmbeddingsResult> response = await client.EmbedAsync(requestOptions);
```

### 5.4 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using wrong options type
```csharp
// WRONG - Image embeddings use ImageEmbeddingsOptions
var client = new ImageEmbeddingsClient(endpoint, credential, new AzureAIInferenceClientOptions());
var options = new EmbeddingsOptions(new[] { "text" });  // Wrong type for images
```

#### ❌ INCORRECT: Accessing embedding as array directly
```csharp
// WRONG - Must deserialize embedding
float[] embedding = item.Embedding;  // Embedding is BinaryData, not float[]
```

---

## 6. Model Information Patterns

### 6.1 ✅ CORRECT: Get Model Info
```csharp
Response<ModelInfo> modelInfo = client.GetModelInfo();

Console.WriteLine($"Model name: {modelInfo.Value.ModelName}");
Console.WriteLine($"Model type: {modelInfo.Value.ModelType}");
Console.WriteLine($"Model provider: {modelInfo.Value.ModelProviderName}");
```

### 6.2 ✅ CORRECT: Async Model Info
```csharp
Response<ModelInfo> modelInfo = await client.GetModelInfoAsync();
Console.WriteLine(modelInfo.Value.ModelName);
```

---

## 7. Error Handling Patterns

### 7.1 ✅ CORRECT: Handle RequestFailedException
```csharp
try
{
    Response<ChatCompletions> response = client.Complete(requestOptions);
}
catch (RequestFailedException ex)
{
    Console.WriteLine($"Status: {ex.Status}");
    Console.WriteLine($"Error: {ex.Message}");
    
    switch (ex.Status)
    {
        case 429:
            // Rate limited - implement backoff
            break;
        case 400:
            // Bad request - check parameters
            break;
        case 401:
            // Unauthorized - check credentials
            break;
    }
}
```

### 7.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Catching generic Exception only
```csharp
// WRONG - Should specifically handle RequestFailedException
try
{
    var response = client.Complete(requestOptions);
}
catch (Exception ex)
{
    Console.WriteLine(ex.Message);  // Loses status code info
}
```

---

## 8. Observability Patterns

### 8.1 ✅ CORRECT: Enable OpenTelemetry Tracing
```csharp
// Enable experimental tracing
AppContext.SetSwitch("Azure.Experimental.EnableActivitySource", true);

// Optional: Enable content recording (may contain sensitive data)
AppContext.SetSwitch("Azure.Experimental.TraceGenAIMessageContent", true);

using var tracerProvider = Sdk.CreateTracerProviderBuilder()
    .AddSource("Azure.AI.Inference.*")
    .AddConsoleExporter()
    .Build();

using var meterProvider = Sdk.CreateMeterProviderBuilder()
    .AddMeter("Azure.AI.Inference.*")
    .AddConsoleExporter()
    .Build();
```

---

## 9. Additional Parameters Patterns

### 9.1 ✅ CORRECT: Pass Model-Specific Parameters
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestSystemMessage("You are a helpful assistant."),
        new ChatRequestUserMessage("Hello!"),
    },
    AdditionalProperties = { { "foo", BinaryData.FromString("\"bar\"") } },
};

Response<ChatCompletions> response = client.Complete(requestOptions);
```

### 9.2 ✅ CORRECT: Temperature and Max Tokens
```csharp
var requestOptions = new ChatCompletionsOptions()
{
    Messages =
    {
        new ChatRequestUserMessage("Write a haiku about coding."),
    },
    Temperature = 0.7f,
    MaxTokens = 100,
};
```

---

## 10. Key Types Reference

| Type | Purpose |
|------|---------|
| `ChatCompletionsClient` | Main client for chat completions |
| `EmbeddingsClient` | Client for text embeddings |
| `ImageEmbeddingsClient` | Client for image embeddings |
| `ChatCompletionsOptions` | Request options for chat completions |
| `EmbeddingsOptions` | Request options for text embeddings |
| `ImageEmbeddingsOptions` | Request options for image embeddings |
| `ChatCompletions` | Response containing chat completion |
| `EmbeddingsResult` | Response containing embeddings |
| `StreamingChatCompletionsUpdate` | Streaming response update |
| `ChatRequestSystemMessage` | System message in conversation |
| `ChatRequestUserMessage` | User message in conversation |
| `ChatRequestAssistantMessage` | Assistant message in conversation |
| `ChatRequestToolMessage` | Tool result message |
| `ChatMessageTextContentItem` | Text content for multi-modal |
| `ChatMessageImageContentItem` | Image content for multi-modal |
| `ChatCompletionsFunctionToolDefinition` | Function tool definition |
| `ChatCompletionsFunctionToolCall` | Function tool call from model |
| `FunctionDefinition` | Function metadata (name, params) |
| `ModelInfo` | Information about the deployed model |
| `AzureAIInferenceClientOptions` | Client configuration options |
| `AzureKeyCredential` | API key credential wrapper |
| `RequestFailedException` | Azure SDK exception type |

---

## 11. Best Practices Summary

1. **Reuse clients** — Clients are thread-safe; create once and reuse
2. **Use DefaultAzureCredential** — Prefer over API keys for production
3. **Handle streaming for long responses** — Reduces time-to-first-token
4. **Use async methods** — `CompleteAsync`, `EmbedAsync` for web apps
5. **Handle RequestFailedException** — Check Status for retry logic
6. **Include AzureAIInferenceClientOptions** — Required for API key auth
7. **Loop tool calls** — Continue until no more tool calls are returned
8. **Deserialize embeddings** — Use `ToObjectFromJson<List<float>>()`
