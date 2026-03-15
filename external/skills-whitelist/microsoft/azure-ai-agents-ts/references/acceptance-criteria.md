# Azure AI Agents SDK Acceptance Criteria (TypeScript)

**SDK**: `@azure/ai-agents`
**Repository**: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/ai/ai-agents
**Purpose**: Skill testing acceptance criteria for validating generated code correctness

---

## 1. Correct Import Patterns

### 1.1 Client Imports

#### ✅ CORRECT: AgentsClient Import
```typescript
import { AgentsClient } from "@azure/ai-agents";
import { DefaultAzureCredential } from "@azure/identity";
```

#### ✅ CORRECT: Tool Utilities Import
```typescript
import { AgentsClient, ToolUtility, ToolSet } from "@azure/ai-agents";
```

#### ✅ CORRECT: Type Imports
```typescript
import type {
  FunctionToolDefinition,
  RequiredToolCall,
  ToolOutput,
} from "@azure/ai-agents";
```

### 1.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using Projects Client for Agents
```typescript
// WRONG - AgentsClient is in @azure/ai-agents, not @azure/ai-projects
import { AgentsClient } from "@azure/ai-projects";
```

#### ❌ INCORRECT: Wrong model imports
```typescript
// WRONG - ToolUtility is exported from main package
import { ToolUtility } from "@azure/ai-agents/models";

// WRONG - These don't exist in the JS SDK
import { SystemMessage, UserMessage } from "@azure/ai-agents";
```

---

## 2. Client Creation Patterns

### 2.1 ✅ CORRECT: Creating AgentsClient
```typescript
import { AgentsClient } from "@azure/ai-agents";
import { DefaultAzureCredential } from "@azure/identity";

const projectEndpoint = process.env.PROJECT_ENDPOINT!;
const client = new AgentsClient(projectEndpoint, new DefaultAzureCredential());
```

### 2.2 ✅ CORRECT: Via AIProjectClient (Recommended)
```typescript
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const projectEndpoint = process.env.AZURE_AI_PROJECT_ENDPOINT!;
const projectClient = new AIProjectClient(projectEndpoint, new DefaultAzureCredential());

// Use agents through project client
const agent = await projectClient.agents.createAgent("gpt-4o", {
  name: "my-agent",
  instructions: "You are a helpful assistant",
});
```

### 2.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Missing 'new' keyword
```typescript
// WRONG - AgentsClient is a class, needs 'new'
const client = AgentsClient(endpoint, credential);
```

#### ❌ INCORRECT: Wrong parameter order
```typescript
// WRONG - endpoint should be first
const client = new AgentsClient(new DefaultAzureCredential(), endpoint);
```

---

## 3. Agent Creation Patterns

### 3.1 ✅ CORRECT: Basic Agent Creation
```typescript
const agent = await client.createAgent("gpt-4o", {
  name: "my-agent",
  instructions: "You are a helpful assistant",
});

console.log(`Created agent: ${agent.id}`);
```

### 3.2 ✅ CORRECT: Agent with Tools using ToolSet
```typescript
import { ToolSet } from "@azure/ai-agents";
import * as fs from "fs";

// Upload file for code interpreter
const fileStream = fs.createReadStream("./data/sample.csv");
const file = await client.files.upload(fileStream, "assistants", {
  fileName: "sample.csv",
});

// Create tool set
const toolSet = new ToolSet();
toolSet.addCodeInterpreterTool([file.id]);

const agent = await client.createAgent("gpt-4o", {
  name: "data-analyst",
  instructions: "You are a data analyst",
  tools: toolSet.toolDefinitions,
  toolResources: toolSet.toolResources,
});
```

### 3.3 ✅ CORRECT: Agent with ToolUtility
```typescript
import { ToolUtility } from "@azure/ai-agents";

const codeInterpreterTool = ToolUtility.createCodeInterpreterTool([file.id]);

const agent = await client.createAgent("gpt-4o", {
  name: "my-agent",
  instructions: "You are a helpful assistant",
  tools: [codeInterpreterTool.definition],
  toolResources: codeInterpreterTool.resources,
});
```

### 3.4 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong parameter structure
```typescript
// WRONG - model is first positional argument
const agent = await client.createAgent({
  model: "gpt-4o",
  name: "my-agent",
  instructions: "You are a helpful assistant",
});
```

---

## 4. Thread and Message Patterns

### 4.1 ✅ CORRECT: Create Thread and Message
```typescript
const thread = await client.threads.create();

await client.messages.create(thread.id, {
  role: "user",
  content: "Hello! Can you help me?",
});
```

### 4.2 ✅ CORRECT: List Messages
```typescript
const messages = await client.messages.list(thread.id);
for (const msg of messages.data) {
  if (msg.role === "assistant") {
    console.log(msg.content[0].text.value);
  }
}
```

### 4.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong method signature
```typescript
// WRONG - messages.create needs thread_id as first arg
await client.messages.create({
  threadId: thread.id,
  role: "user",
  content: "Hello!",
});
```

---

## 5. Run Patterns

### 5.1 ✅ CORRECT: Create and Process Run
```typescript
const run = await client.runs.createAndProcess(thread.id, agent.id);

if (run.status === "completed") {
  const messages = await client.messages.list(thread.id);
  const lastMessage = messages.data[0];
  if (lastMessage.role === "assistant") {
    console.log(lastMessage.content[0].text.value);
  }
}
```

### 5.2 ✅ CORRECT: Create and Process with ToolSet
```typescript
const run = await client.runs.createAndProcess(thread.id, agent.id, {
  toolset: toolSet,
});
```

### 5.3 ✅ CORRECT: Manual Run Polling
```typescript
let run = await client.runs.create(thread.id, agent.id);

while (run.status === "queued" || run.status === "in_progress") {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.runs.get(thread.id, run.id);
}

if (run.status === "completed") {
  // Handle completed run
} else if (run.status === "failed") {
  console.error(`Run failed: ${run.lastError?.message}`);
}
```

### 5.4 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong argument order
```typescript
// WRONG - thread_id should be first
const run = await client.runs.createAndProcess(agent.id, thread.id);
```

---

## 6. Tool Patterns

### 6.1 ✅ CORRECT: File Search Tool
```typescript
import { ToolUtility } from "@azure/ai-agents";
import * as fs from "fs";

// Upload file
const fileStream = fs.createReadStream("./docs/manual.pdf");
const file = await client.files.upload(fileStream, "assistants", {
  fileName: "manual.pdf",
});

// Create vector store
const vectorStore = await client.vectorStores.create({
  fileIds: [file.id],
  name: "my-docs",
});

// Create file search tool
const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);

const agent = await client.createAgent("gpt-4o", {
  name: "doc-assistant",
  instructions: "Answer questions from the documentation",
  tools: [fileSearchTool.definition],
  toolResources: fileSearchTool.resources,
});
```

### 6.2 ✅ CORRECT: Code Interpreter Tool
```typescript
import { ToolUtility } from "@azure/ai-agents";

const codeInterpreterTool = ToolUtility.createCodeInterpreterTool([file.id]);

const agent = await client.createAgent("gpt-4o", {
  name: "analyst",
  instructions: "Analyze data and create visualizations",
  tools: [codeInterpreterTool.definition],
  toolResources: codeInterpreterTool.resources,
});
```

### 6.3 ✅ CORRECT: Bing Grounding Tool
```typescript
import { ToolUtility } from "@azure/ai-agents";

const connectionId = process.env.AZURE_BING_CONNECTION_ID!;
const bingTool = ToolUtility.createBingGroundingTool([{ connectionId }]);

const agent = await client.createAgent("gpt-4o", {
  name: "web-searcher",
  instructions: "Search the web to answer questions",
  tools: [bingTool.definition],
});
```

### 6.4 ✅ CORRECT: Azure AI Search Tool
```typescript
import { ToolUtility } from "@azure/ai-agents";

const connectionName = process.env.AZURE_AI_SEARCH_CONNECTION_NAME!;
const searchTool = ToolUtility.createAzureAISearchTool(
  connectionName,
  "products-index",
  {
    queryType: "simple",
    topK: 3,
    indexConnectionId: connectionName,
    indexName: "products-index",
  },
);

const agent = await client.createAgent("gpt-4o", {
  name: "search-agent",
  instructions: "Search products",
  tools: [searchTool.definition],
  toolResources: searchTool.resources,
});
```

### 6.5 ✅ CORRECT: Connected Agent Tool (Multi-Agent)
```typescript
import { ToolUtility } from "@azure/ai-agents";

// Create specialist agent first
const stockAgent = await client.createAgent("gpt-4o", {
  name: "stock-price-agent",
  instructions: "Get stock prices for companies",
});

// Create connected agent tool
const connectedAgentTool = ToolUtility.createConnectedAgentTool(
  stockAgent.id,
  "stock_price_bot",
  "Gets the stock price of a company",
);

// Create main agent with connected agent
const mainAgent = await client.createAgent("gpt-4o", {
  name: "main-agent",
  instructions: "Help users with stock information using the connected agent",
  tools: [connectedAgentTool.definition],
});
```

---

## 7. Function Calling Patterns

### 7.1 ✅ CORRECT: Function Tool Definition
```typescript
import { ToolUtility, FunctionToolDefinition, RequiredToolCall, ToolOutput } from "@azure/ai-agents";

const weatherTool = ToolUtility.createFunctionTool({
  name: "getWeather",
  description: "Gets the weather for a location",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string", description: "City and state" },
      unit: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
    required: ["location"],
  },
});

const agent = await client.createAgent("gpt-4o", {
  name: "weather-agent",
  instructions: "Help users with weather information",
  tools: [weatherTool.definition],
});
```

### 7.2 ✅ CORRECT: Function Tool Executor Pattern
```typescript
class FunctionToolExecutor {
  private functionTools: {
    func: Function;
    definition: FunctionToolDefinition;
  }[];

  constructor() {
    this.functionTools = [
      {
        func: this.getWeather.bind(this),
        ...ToolUtility.createFunctionTool({
          name: "getWeather",
          description: "Gets the weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string" },
            },
            required: ["location"],
          },
        }),
      },
    ];
  }

  private getWeather(location: string): object {
    return { weather: "72°F and sunny" };
  }

  invokeTool(toolCall: RequiredToolCall & FunctionToolDefinition): ToolOutput | undefined {
    const args = toolCall.function.parameters
      ? JSON.parse(toolCall.function.parameters)
      : {};

    const tool = this.functionTools.find(
      (t) => t.definition.function.name === toolCall.function.name,
    );

    if (tool) {
      const result = tool.func(...Object.values(args));
      return {
        toolCallId: toolCall.id,
        output: JSON.stringify(result),
      };
    }
    return undefined;
  }

  getFunctionDefinitions(): FunctionToolDefinition[] {
    return this.functionTools.map((t) => t.definition);
  }
}
```

---

## 8. Streaming Patterns

### 8.1 ✅ CORRECT: Streaming with Event Handler
```typescript
import { AgentEventHandler } from "@azure/ai-agents";

class MyEventHandler extends AgentEventHandler {
  onMessageDelta(delta: any): void {
    if (delta.text) {
      process.stdout.write(delta.text.value);
    }
  }

  onError(data: any): void {
    console.error("Error:", data);
  }
}

const stream = await client.runs.stream(thread.id, agent.id, {
  eventHandler: new MyEventHandler(),
});

await stream.untilDone();
```

### 8.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using stream=true flag
```typescript
// WRONG - streaming uses .stream() method with event handler
const run = await client.runs.createAndProcess(thread.id, agent.id, {
  stream: true,
});
```

---

## 9. File Operations

### 9.1 ✅ CORRECT: Upload File
```typescript
import * as fs from "fs";

const fileStream = fs.createReadStream("./data/report.pdf");
const file = await client.files.upload(fileStream, "assistants", {
  fileName: "report.pdf",
});

console.log(`Uploaded file: ${file.id}`);
```

### 9.2 ✅ CORRECT: Create Vector Store with Polling
```typescript
const vectorStore = await client.vectorStores
  .createAndPoll({
    fileIds: [file.id],
    name: "my-store",
  })
  .pollUntilDone();

console.log(`Vector store ready: ${vectorStore.id}`);
```

---

## 10. Cleanup Patterns

### 10.1 ✅ CORRECT: Delete Agent
```typescript
await client.deleteAgent(agent.id);
console.log("Agent deleted");
```

### 10.2 ✅ CORRECT: Full Cleanup
```typescript
// Delete agent
await client.deleteAgent(agent.id);

// Delete vector store
await client.vectorStores.delete(vectorStore.id);

// Delete files
await client.files.delete(file.id);
```

---

## 11. Environment Variables

### 11.1 ✅ CORRECT: Required Variables
```typescript
const projectEndpoint = process.env.PROJECT_ENDPOINT!;
const modelDeploymentName = process.env.MODEL_DEPLOYMENT_NAME || "gpt-4o";
```

### 11.2 ❌ INCORRECT: Hardcoded values
```typescript
// WRONG - hardcoded endpoint
const client = new AgentsClient(
  "https://my-project.services.ai.azure.com",
  new DefaultAzureCredential(),
);
```
