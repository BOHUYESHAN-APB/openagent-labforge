# Azure AI Inference SDK Acceptance Criteria (TypeScript)

**SDK**: `@azure-rest/ai-inference`
**Repository**: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/ai/ai-inference-rest
**Purpose**: Skill testing acceptance criteria for validating generated code correctness

---

## 1. Imports

### 1.1 ✅ CORRECT: Default Client Import (REST Client)
```typescript
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
```

### 1.2 ✅ CORRECT: With DefaultAzureCredential
```typescript
import ModelClient from "@azure-rest/ai-inference";
import { DefaultAzureCredential } from "@azure/identity";
```

### 1.3 ✅ CORRECT: SSE Streaming Support
```typescript
import ModelClient from "@azure-rest/ai-inference";
import { createSseStream } from "@azure/core-sse";
import { IncomingMessage } from "node:http";
```

### 1.4 ❌ INCORRECT: Wrong import paths
```typescript
// WRONG - ModelClient is the default export
import { ModelClient } from "@azure-rest/ai-inference";

// WRONG - not a class-based SDK like Python
import { ChatCompletionsClient } from "@azure-rest/ai-inference";

// WRONG - models are not imported separately
import { SystemMessage, UserMessage } from "@azure-rest/ai-inference/models";
```

---

## 2. Authentication

### 2.1 ✅ CORRECT: API Key Credential
```typescript
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const client = ModelClient(
  process.env.AZURE_INFERENCE_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_INFERENCE_CREDENTIAL!),
);
```

### 2.2 ✅ CORRECT: Entra ID Credential
```typescript
import ModelClient from "@azure-rest/ai-inference";
import { DefaultAzureCredential } from "@azure/identity";

const client = ModelClient(
  process.env.AZURE_INFERENCE_ENDPOINT!,
  new DefaultAzureCredential(),
);
```

### 2.3 ❌ INCORRECT: Hardcoded credentials
```typescript
// WRONG - hardcoded secrets
const client = ModelClient(
  "https://example.services.ai.azure.com/models",
  new AzureKeyCredential("hardcoded-key"),
);
```

### 2.4 ❌ INCORRECT: Using 'new' keyword
```typescript
// WRONG - ModelClient is a function, not a class
const client = new ModelClient(endpoint, credential);
```

---

## 3. Chat Completions

### 3.1 ✅ CORRECT: Basic Chat Completion
```typescript
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { DefaultAzureCredential } from "@azure/identity";

const client = ModelClient(
  process.env.AZURE_INFERENCE_ENDPOINT!,
  new DefaultAzureCredential(),
);

const response = await client.path("/chat/completions").post({
  body: {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is Azure AI?" },
    ],
  },
});

if (isUnexpected(response)) {
  throw response.body.error;
}

console.log(response.body.choices[0].message.content);
```

### 3.2 ✅ CORRECT: With Model Parameter
```typescript
const response = await client.path("/chat/completions").post({
  body: {
    messages: [
      { role: "user", content: "Hello!" },
    ],
    model: process.env.AZURE_INFERENCE_MODEL,
    max_tokens: 100,
  },
});
```

### 3.3 ❌ INCORRECT: Wrong path syntax
```typescript
// WRONG - should use .path("/chat/completions").post()
const response = await client.chatCompletions.create({
  messages: [{ role: "user", content: "Hello" }],
});

// WRONG - not a method on client
const response = await client.complete({
  messages: [{ role: "user", content: "Hello" }],
});
```

---

## 4. Tool Calling

### 4.1 ✅ CORRECT: Function Tool Definition
```typescript
const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City and state" },
        },
        required: ["location"],
      },
    },
  },
];

const response = await client.path("/chat/completions").post({
  body: {
    messages: [{ role: "user", content: "What's the weather in Seattle?" }],
    tools,
  },
});
```

### 4.2 ✅ CORRECT: Tool Call Response Handling
```typescript
function applyToolCall({ function: call, id }: { function: { name: string; arguments: string }; id: string }) {
  if (call.name === "get_weather") {
    const { location } = JSON.parse(call.arguments);
    return {
      role: "tool" as const,
      content: `The weather in ${location} is 72°F and sunny.`,
      toolCallId: id,
    };
  }
  throw new Error(`Unknown tool call: ${call.name}`);
}
```

### 4.3 ❌ INCORRECT: Wrong tool structure
```typescript
// WRONG - tools should be an array of objects with type: "function"
const tools = [
  {
    name: "get_weather",
    parameters: { location: { type: "string" } },
  },
];
```

---

## 5. Embeddings

### 5.1 ✅ CORRECT: Text Embeddings
```typescript
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { DefaultAzureCredential } from "@azure/identity";

const client = ModelClient(
  process.env.AZURE_INFERENCE_ENDPOINT!,
  new DefaultAzureCredential(),
);

const response = await client.path("/embeddings").post({
  body: {
    input: ["first phrase", "second phrase", "third phrase"],
  },
});

if (isUnexpected(response)) {
  throw response.body.error;
}

for (const data of response.body.data) {
  console.log(`Embedding length: ${data.embedding.length}`);
}
```

### 5.2 ✅ CORRECT: Image Embeddings
```typescript
import { readFileSync } from "node:fs";

function getImageDataUrl(imageFile: string, imageFormat: string): string {
  const imageBuffer = readFileSync(imageFile);
  const imageBase64 = imageBuffer.toString("base64");
  return `data:image/${imageFormat};base64,${imageBase64}`;
}

const image = getImageDataUrl("image.png", "png");

const response = await client.path("/images/embeddings").post({
  body: {
    input: [{ image }],
  },
});
```

### 5.3 ❌ INCORRECT: Wrong method
```typescript
// WRONG - should use .path("/embeddings").post()
const response = await client.embed({
  input: ["text"],
});
```

---

## 6. Streaming

### 6.1 ✅ CORRECT: Streaming with SSE
```typescript
import ModelClient from "@azure-rest/ai-inference";
import { DefaultAzureCredential } from "@azure/identity";
import { createSseStream } from "@azure/core-sse";
import { IncomingMessage } from "node:http";

const client = ModelClient(
  process.env.AZURE_INFERENCE_ENDPOINT!,
  new DefaultAzureCredential(),
);

const response = await client
  .path("/chat/completions")
  .post({
    body: {
      messages: [{ role: "user", content: "Write a poem about Azure." }],
      stream: true,
    },
  })
  .asNodeStream();

const stream = response.body;
if (!stream) {
  throw new Error("The response stream is undefined");
}

if (response.status !== "200") {
  throw new Error("Failed to get chat completions");
}

const sses = createSseStream(stream as IncomingMessage);

for await (const event of sses) {
  if (event.data === "[DONE]") {
    break;
  }
  for (const choice of JSON.parse(event.data).choices) {
    process.stdout.write(choice.delta?.content ?? "");
  }
}
```

### 6.2 ❌ INCORRECT: Missing asNodeStream
```typescript
// WRONG - streaming requires .asNodeStream() for SSE
const response = await client.path("/chat/completions").post({
  body: {
    messages: [{ role: "user", content: "Hello" }],
    stream: true,
  },
});

// WRONG - response is not directly iterable
for await (const chunk of response) {
  console.log(chunk);
}
```

---

## 7. Image Chat

### 7.1 ✅ CORRECT: Chat with Images
```typescript
const imageUrl = "https://example.com/image.jpg";

const response = await client.path("/chat/completions").post({
  body: {
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "auto",
            },
          },
        ],
      },
      { role: "user", content: "Describe this image" },
    ],
  },
});
```

### 7.2 ❌ INCORRECT: Wrong image format
```typescript
// WRONG - image should be in content array with type
const response = await client.path("/chat/completions").post({
  body: {
    messages: [
      { role: "user", content: "https://example.com/image.jpg" },
      { role: "user", content: "Describe this image" },
    ],
  },
});
```

---

## 8. Error Handling

### 8.1 ✅ CORRECT: Using isUnexpected Guard
```typescript
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";

const response = await client.path("/chat/completions").post({
  body: {
    messages: [{ role: "user", content: "Hello" }],
  },
});

if (isUnexpected(response)) {
  console.error("Error:", response.body.error);
  throw response.body.error;
}

// Safe to access response.body.choices here
console.log(response.body.choices[0].message.content);
```

### 8.2 ❌ INCORRECT: Not checking for errors
```typescript
// WRONG - should check isUnexpected before accessing body
const response = await client.path("/chat/completions").post({
  body: { messages: [{ role: "user", content: "Hello" }] },
});

// May fail if response is an error
console.log(response.body.choices[0].message.content);
```

---

## 9. Instrumentation/Tracing

### 9.1 ✅ CORRECT: OpenTelemetry Setup
```typescript
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { createAzureSdkInstrumentation } from "@azure/opentelemetry-instrumentation-azure-sdk";

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

registerInstrumentations({
  instrumentations: [createAzureSdkInstrumentation()],
});
```

### 9.2 ✅ CORRECT: Request with Tracing Context
```typescript
import { context } from "@opentelemetry/api";

const response = await client.path("/chat/completions").post({
  body: {
    messages: [{ role: "user", content: "Hello" }],
  },
  tracingOptions: { tracingContext: context.active() },
});
```
