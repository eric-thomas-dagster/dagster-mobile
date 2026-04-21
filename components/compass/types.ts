export type TextBlock = {
  kind: 'text';
  text: string;
  complete: boolean;
};

export type ToolBlock = {
  kind: 'tool';
  toolType: string;
  toolId: string;
  inputJson: string;
  complete: boolean;
  error?: string;
};

export type Block = TextBlock | ToolBlock;

export type AssistantMessage = {
  role: 'assistant';
  blocks: Block[];
  suggestedReplies: string[];
  error?: string;
  streaming: boolean;
};

export type UserMessage = {
  role: 'user';
  text: string;
};

export type Message = UserMessage | AssistantMessage;

// Mirrors the ChatResponseChunkOrError union from the GraphQL schema.
export type ChatChunk =
  | { __typename: 'StartChatStream'; chatId: number }
  | { __typename: 'CompleteChatStream'; suggestedReplies: string[] }
  | { __typename: 'StartTextBlock'; placeholder: string | null }
  | { __typename: 'DeltaTextBlock'; textFragment: string }
  | { __typename: 'CompleteTextBlock'; placeholder: string | null }
  | { __typename: 'StartToolBlock'; toolType: string; toolId: string }
  | { __typename: 'DeltaToolInputBlock'; jsonFragment: string }
  | { __typename: 'CompleteToolBlock'; toolError: { message: string } | null }
  | { __typename: 'AISummaryError'; message: string }
  | { __typename: 'PythonError'; message: string };

export const applyChunk = (
  msg: AssistantMessage,
  chunk: ChatChunk,
): { message: AssistantMessage; chatId?: number } => {
  const blocks = [...msg.blocks];
  const last = blocks[blocks.length - 1];

  switch (chunk.__typename) {
    case 'StartChatStream':
      return { message: msg, chatId: chunk.chatId };

    case 'StartTextBlock':
      blocks.push({ kind: 'text', text: '', complete: false });
      return { message: { ...msg, blocks } };

    case 'DeltaTextBlock':
      if (last?.kind === 'text' && !last.complete) {
        blocks[blocks.length - 1] = { ...last, text: last.text + chunk.textFragment };
      } else {
        blocks.push({ kind: 'text', text: chunk.textFragment, complete: false });
      }
      return { message: { ...msg, blocks } };

    case 'CompleteTextBlock':
      if (last?.kind === 'text') {
        blocks[blocks.length - 1] = { ...last, complete: true };
      }
      return { message: { ...msg, blocks } };

    case 'StartToolBlock':
      blocks.push({
        kind: 'tool',
        toolType: chunk.toolType,
        toolId: chunk.toolId,
        inputJson: '',
        complete: false,
      });
      return { message: { ...msg, blocks } };

    case 'DeltaToolInputBlock':
      if (last?.kind === 'tool' && !last.complete) {
        blocks[blocks.length - 1] = { ...last, inputJson: last.inputJson + chunk.jsonFragment };
      }
      return { message: { ...msg, blocks } };

    case 'CompleteToolBlock':
      if (last?.kind === 'tool') {
        blocks[blocks.length - 1] = {
          ...last,
          complete: true,
          error: chunk.toolError?.message || undefined,
        };
      }
      return { message: { ...msg, blocks } };

    case 'CompleteChatStream':
      return {
        message: { ...msg, suggestedReplies: chunk.suggestedReplies, streaming: false },
      };

    case 'AISummaryError':
    case 'PythonError':
      return {
        message: { ...msg, error: chunk.message, streaming: false },
      };
  }
};

export const formatToolLabel = (toolType: string): string => {
  return toolType.replace(/^TOOL_TYPE_/, '').replace(/_/g, ' ').toLowerCase();
};
