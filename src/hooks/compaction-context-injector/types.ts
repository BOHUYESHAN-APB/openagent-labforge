export type CompactionContextClient = {
  client: {
    session: {
      messages: (input: { path: { id: string } }) => Promise<unknown>
      promptAsync?: (input: {
        path: { id: string }
        body: {
          noReply?: boolean
          agent?: string
          model?: { providerID: string; modelID: string }
          tools?: Record<string, boolean>
          variant?: string
          parts: Array<{ type: "text"; text: string }>
        }
        query?: { directory: string }
      }) => Promise<unknown>
    }
  }
  directory: string
}
