import { useCallback, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import type { DocumentNode, FetchResult } from '@apollo/client';
import type { Subscription } from 'zen-observable-ts';
import {
  AssistantMessage,
  ChatChunk,
  Message,
  applyChunk,
} from './types';

type Status = 'idle' | 'streaming' | 'error';

const emptyAssistant = (): AssistantMessage => ({
  role: 'assistant',
  blocks: [],
  suggestedReplies: [],
  streaming: true,
});

type Opts = {
  subscription: DocumentNode;
  // Returns the variables for a given prompt. For AIChat this includes chatId + payload;
  // for AISummaryFor* subscriptions there's no user prompt (variables come from the caller).
  buildVariables: (ctx: { prompt: string; chatId: number }) => Record<string, unknown>;
  // The GraphQL field name whose value holds each chunk (e.g. 'aiChat', 'aiSummaryForAssetMaterialization').
  responseField: string;
};

export const useChatStream = ({ subscription, buildVariables, responseField }: Opts) => {
  const client = useApolloClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const statusRef = useRef<Status>('idle');
  const chatIdRef = useRef(0);
  const activeSubRef = useRef<Subscription | null>(null);
  const buildVariablesRef = useRef(buildVariables);
  buildVariablesRef.current = buildVariables;

  const setStatusBoth = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const cancel = useCallback(() => {
    activeSubRef.current?.unsubscribe();
    activeSubRef.current = null;
    setStatusBoth('idle');
    setMessages((prev) =>
      prev.map((m) =>
        m.role === 'assistant' && m.streaming ? { ...m, streaming: false } : m,
      ),
    );
  }, [setStatusBoth]);

  const reset = useCallback(() => {
    cancel();
    chatIdRef.current = 0;
    setMessages([]);
  }, [cancel]);

  // IMPORTANT: `send` must be a stable reference. If it changes on every
  // render (e.g. because `status` was in the deps), consumers with effects
  // that depend on `send` will re-run and cancel the subscription we just
  // started. Use refs for anything that would otherwise change identity.
  const send = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || statusRef.current === 'streaming') return;

      // Append user message + placeholder assistant message
      setMessages((prev) => [
        ...prev,
        ...(prompt ? [{ role: 'user', text: trimmed } as Message] : []),
        emptyAssistant(),
      ]);
      setStatusBoth('streaming');

      const variables = buildVariablesRef.current({ prompt: trimmed, chatId: chatIdRef.current });
      const observable = client.subscribe({ query: subscription, variables });

      // If no chunk arrives in ~20s, surface a timeout error so a silent
      // auth/handshake failure doesn't just leave the UI hanging.
      let firstChunkSeen = false;
      const timeoutId = setTimeout(() => {
        if (firstChunkSeen) return;
        console.warn('[Compass] no chunks received after 20s — likely WS auth/connect failure');
        activeSubRef.current?.unsubscribe();
        activeSubRef.current = null;
        setStatusBoth('error');
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          const last = next[lastIdx];
          if (last?.role === 'assistant') {
            next[lastIdx] = {
              ...last,
              error:
                'No response from Compass. Check your API token in Settings and that the deployment URL is correct.',
              streaming: false,
            };
          }
          return next;
        });
      }, 20000);

      activeSubRef.current = observable.subscribe({
        next: (result: FetchResult<Record<string, ChatChunk | null>>) => {
          firstChunkSeen = true;
          const chunk = result.data?.[responseField];
          if (!chunk) return;

          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            const last = next[lastIdx];
            if (!last || last.role !== 'assistant') return prev;

            const { message, chatId } = applyChunk(last, chunk);
            if (chatId !== undefined) {
              chatIdRef.current = chatId;
            }
            next[lastIdx] = message;
            return next;
          });
        },
        error: (err: Error) => {
          clearTimeout(timeoutId);
          console.warn('[Compass] subscription error:', err);
          setStatusBoth('error');
          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            const last = next[lastIdx];
            if (last?.role === 'assistant') {
              next[lastIdx] = {
                ...last,
                error: err.message || 'Stream error',
                streaming: false,
              };
            }
            return next;
          });
          activeSubRef.current = null;
        },
        complete: () => {
          clearTimeout(timeoutId);
          setStatusBoth('idle');
          setMessages((prev) =>
            prev.map((m) =>
              m.role === 'assistant' && m.streaming ? { ...m, streaming: false } : m,
            ),
          );
          activeSubRef.current = null;
        },
      });
    },
    [client, subscription, responseField, setStatusBoth],
  );

  return { messages, status, send, cancel, reset };
};
