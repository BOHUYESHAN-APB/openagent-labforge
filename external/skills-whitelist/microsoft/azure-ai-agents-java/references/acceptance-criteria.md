# Azure AI Agents SDK for Java Acceptance Criteria

**SDK**: `com.azure:azure-ai-agents`
**Repository**: https://github.com/Azure/azure-sdk-for-java/tree/main/sdk/ai/azure-ai-agents
**Purpose**: Skill testing acceptance criteria for validating generated code correctness

---

## 1. Correct Import Patterns

### 1.1 Client Imports

#### ✅ CORRECT: Client Builder and Clients
```java
import com.azure.ai.agents.AgentsClient;
import com.azure.ai.agents.AgentsAsyncClient;
import com.azure.ai.agents.AgentsClientBuilder;
import com.azure.ai.agents.ConversationsClient;
import com.azure.ai.agents.ConversationsAsyncClient;
import com.azure.ai.agents.ResponsesClient;
import com.azure.ai.agents.ResponsesAsyncClient;
import com.azure.ai.agents.MemoryStoresClient;
```

#### ✅ CORRECT: Authentication
```java
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.core.credential.AzureKeyCredential;
```

### 1.2 Model Imports

#### ✅ CORRECT: Agent Models
```java
import com.azure.ai.agents.models.PromptAgentDefinition;
import com.azure.ai.agents.models.AgentVersionDetails;
import com.azure.ai.agents.models.AgentDetails;
import com.azure.ai.agents.models.AgentReference;
import com.azure.ai.agents.models.DeleteAgentResponse;
import com.azure.ai.agents.models.DeleteAgentVersionResponse;
```

#### ✅ CORRECT: OpenAI Integration Models
```java
import com.openai.models.conversations.Conversation;
import com.openai.models.conversations.items.ConversationItemList;
import com.openai.models.conversations.items.ItemCreateParams;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.EasyInputMessage;
```

### 1.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong import paths
```java
// WRONG - Models are not in the main package
import com.azure.ai.agents.PromptAgentDefinition;

// WRONG - Using non-existent classes
import com.azure.ai.agents.Agent;
import com.azure.ai.agents.Thread;
import com.azure.ai.agents.Message;

// WRONG - Using old OpenAI SDK patterns
import com.openai.OpenAIClient;
```

---

## 2. Client Creation Patterns

### 2.1 ✅ CORRECT: Builder with DefaultAzureCredential
```java
String endpoint = System.getenv("PROJECT_ENDPOINT");

AgentsClientBuilder builder = new AgentsClientBuilder()
    .endpoint(endpoint)
    .credential(new DefaultAzureCredentialBuilder().build());

AgentsClient agentsClient = builder.buildAgentsClient();
ConversationsClient conversationsClient = builder.buildConversationsClient();
ResponsesClient responsesClient = builder.buildResponsesClient();
```

### 2.2 ✅ CORRECT: Async Clients
```java
AgentsAsyncClient agentsAsyncClient = builder.buildAsyncClient();
ConversationsAsyncClient conversationsAsyncClient = builder.buildConversationsAsyncClient();
ResponsesAsyncClient responsesAsyncClient = builder.buildResponsesAsyncClient();
```

### 2.3 ✅ CORRECT: With Service Version
```java
AgentsClientBuilder builder = new AgentsClientBuilder()
    .credential(new DefaultAzureCredentialBuilder().build())
    .endpoint(endpoint)
    .serviceVersion(AgentsServiceVersion.V2025_05_15_PREVIEW);
```

### 2.4 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong parameter names
```java
// WRONG - using 'url' instead of 'endpoint'
AgentsClientBuilder builder = new AgentsClientBuilder()
    .url(endpoint)
    .credential(credential);

// WRONG - missing endpoint
AgentsClient client = new AgentsClientBuilder()
    .credential(credential)
    .buildAgentsClient();
```

#### ❌ INCORRECT: Hardcoded credentials
```java
// WRONG - hardcoded endpoint
AgentsClient client = new AgentsClientBuilder()
    .endpoint("https://myresource.services.ai.azure.com")
    .credential(new AzureKeyCredential("hardcoded-key"))
    .buildAgentsClient();
```

---

## 3. Agent Operations

### 3.1 ✅ CORRECT: Create Agent with PromptAgentDefinition
```java
String model = System.getenv("MODEL_DEPLOYMENT_NAME");

PromptAgentDefinition definition = new PromptAgentDefinition(model);
AgentVersionDetails agent = agentsClient.createAgentVersion("my-agent", definition);

System.out.println("Agent ID: " + agent.getId());
System.out.println("Agent Name: " + agent.getName());
System.out.println("Agent Version: " + agent.getVersion());
```

### 3.2 ✅ CORRECT: Get Agent
```java
AgentDetails agent = agentsClient.getAgent("my-agent-name");
System.out.println("Latest Version: " + agent.getVersions().getLatest());
```

### 3.3 ✅ CORRECT: List Agents
```java
for (AgentDetails agent : agentsClient.listAgents()) {
    System.out.println("Agent: " + agent.getName());
}
```

### 3.4 ✅ CORRECT: Delete Agent
```java
// Delete specific version
DeleteAgentVersionResponse deletedVersion = agentsClient.deleteAgentVersion("my-agent", "1");

// Delete entire agent
DeleteAgentResponse deletedAgent = agentsClient.deleteAgent("my-agent");
```

### 3.5 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Wrong method signatures
```java
// WRONG - createAgent doesn't exist, use createAgentVersion
agentsClient.createAgent(definition);

// WRONG - model is required in PromptAgentDefinition constructor
PromptAgentDefinition def = new PromptAgentDefinition();
```

---

## 4. Conversation Management

### 4.1 ✅ CORRECT: Create Conversation
```java
Conversation conversation = conversationsClient.getConversationService().create();
System.out.println("Conversation ID: " + conversation.id());
```

### 4.2 ✅ CORRECT: Add Messages
```java
conversationsClient.getConversationService().items().create(
    ItemCreateParams.builder()
        .conversationId(conversation.id())
        .addItem(EasyInputMessage.builder()
            .role(EasyInputMessage.Role.SYSTEM)
            .content("You are a helpful assistant.")
            .build())
        .addItem(EasyInputMessage.builder()
            .role(EasyInputMessage.Role.USER)
            .content("Hello!")
            .build())
        .build()
);
```

### 4.3 ✅ CORRECT: Update Conversation Metadata
```java
import com.openai.core.JsonValue;
import com.openai.models.conversations.ConversationUpdateParams;

ConversationUpdateParams.Metadata metadata = ConversationUpdateParams.Metadata.builder()
    .putAdditionalProperty("user_id", JsonValue.from("user123"))
    .build();

ConversationUpdateParams updateParams = ConversationUpdateParams.builder()
    .metadata(metadata)
    .build();

Conversation updated = conversationsClient.getConversationService()
    .update(conversationId, updateParams);
```

### 4.4 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Using wrong message roles
```java
// WRONG - role is not "human"
EasyInputMessage.builder()
    .role(EasyInputMessage.Role.HUMAN)  // Should be USER
    .content("Hello")
    .build();
```

---

## 5. Response Generation

### 5.1 ✅ CORRECT: Create Response with Model
```java
ResponseCreateParams responseRequest = new ResponseCreateParams.Builder()
    .input("What is Azure AI?")
    .model(model)
    .build();

Response response = responsesClient.getResponseService().create(responseRequest);
System.out.println("Response: " + response.output());
```

### 5.2 ✅ CORRECT: Create Response with Agent Reference
```java
AgentReference agentRef = new AgentReference(agent.getName())
    .setVersion(agent.getVersion());

Response response = responsesClient.createWithAgentConversation(
    agentRef,
    conversation.id()
);
```

### 5.3 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Missing model in request
```java
// WRONG - model is required when not using agent reference
ResponseCreateParams request = new ResponseCreateParams.Builder()
    .input("Hello")
    .build();  // Missing .model()
```

---

## 6. Error Handling

### 6.1 ✅ CORRECT: HTTP Exception Handling
```java
import com.azure.core.exception.HttpResponseException;

try {
    AgentVersionDetails agent = agentsClient.createAgentVersion(name, definition);
} catch (HttpResponseException e) {
    System.err.println("HTTP Status: " + e.getResponse().getStatusCode());
    System.err.println("Error: " + e.getMessage());
}
```

### 6.2 Anti-Patterns (ERRORS)

#### ❌ INCORRECT: Empty catch blocks
```java
// WRONG - swallowing exceptions
try {
    agentsClient.createAgentVersion(name, definition);
} catch (Exception e) {
    // Do nothing
}
```

---

## 7. Best Practices Checklist

- [ ] Use `DefaultAzureCredentialBuilder` for production authentication
- [ ] Use environment variables for endpoint and model configuration
- [ ] Share conversations across multiple agents for centralized context
- [ ] Use async clients for better throughput in high-concurrency scenarios
- [ ] Clean up conversations when no longer needed
- [ ] Handle exceptions appropriately with proper error messages
- [ ] Reuse the `AgentsClientBuilder` to create multiple sub-clients
