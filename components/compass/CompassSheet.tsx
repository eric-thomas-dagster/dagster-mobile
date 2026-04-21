import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeProvider';
import { AI_CHAT_SUBSCRIPTION } from '../../lib/graphql/compass';
import { useChatStream } from './useChatStream';
import { ChatBlocks } from './ChatBlocks';
import { CompassIcon } from './CompassIcon';

type Props = {
  visible: boolean;
  onClose: () => void;
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
};

// Empty-state starter prompts. Kept broad so they work for any deployment.
const EMPTY_STATE_SUGGESTIONS = [
  'Which pipelines have the longest runtimes?',
  "What's broken right now?",
  'Summarize the last failed run',
  'Which assets are consuming the most credits?',
  'Show me recent asset check failures',
  'Which assets are stale?',
];

export const CompassSheet: React.FC<Props> = ({
  visible,
  onClose,
  pendingPrompt,
  onPendingPromptConsumed,
}) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const buildVariables = useCallback(
    ({ prompt, chatId }: { prompt: string; chatId: number }) => ({
      chatId,
      payload: prompt,
    }),
    [],
  );

  const { messages, status, send, reset } = useChatStream({
    subscription: AI_CHAT_SUBSCRIPTION,
    buildVariables,
    responseField: 'aiChat',
  });

  // Start a fresh chat each time the sheet opens, then auto-send a pending
  // prompt if one was passed in via openWithPrompt. The effect's deps are
  // intentionally minimal — we only want to run when `visible` transitions,
  // not when `send`/`reset`/etc identities shift (that would cancel the
  // in-flight subscription). Refs hold the latest values at execution time.
  const resetRef = useRef(reset);
  resetRef.current = reset;
  const sendRef = useRef(send);
  sendRef.current = send;
  const pendingPromptRef = useRef(pendingPrompt);
  pendingPromptRef.current = pendingPrompt;
  const onConsumeRef = useRef(onPendingPromptConsumed);
  onConsumeRef.current = onPendingPromptConsumed;

  useEffect(() => {
    if (!visible) return;
    resetRef.current();
    const prompt = pendingPromptRef.current;
    if (prompt) {
      const t = setTimeout(() => {
        sendRef.current(prompt);
        onConsumeRef.current?.();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || status === 'streaming') return;
    send(input);
    setInput('');
  };

  const handleSuggestedReply = (reply: string) => {
    if (status === 'streaming') return;
    send(reply);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <CompassIcon size={22} />
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Compass
            </Text>
          </View>
          <IconButton icon="close" onPress={onClose} size={22} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  Ask Compass anything about Dagster+
                </Text>
                <Text style={[styles.emptyBody, { color: theme.colors.onSurfaceVariant }]}>
                  Pick a suggestion to get started, or type your own question below.
                </Text>
                <View style={styles.suggestionsWrap}>
                  {EMPTY_STATE_SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => send(s)}
                      disabled={status === 'streaming'}
                      style={[
                        styles.suggestionPill,
                        {
                          borderColor: theme.colors.primary,
                          backgroundColor: theme.colors.surface,
                          opacity: status === 'streaming' ? 0.5 : 1,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '500' }}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {messages.map((msg, idx) => {
              const isLast = idx === messages.length - 1;
              if (msg.role === 'user') {
                return (
                  <View
                    key={idx}
                    style={[
                      styles.userBubble,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={{ color: theme.colors.onPrimary }}>{msg.text}</Text>
                  </View>
                );
              }
              return (
                <View key={idx} style={styles.assistantBlock}>
                  <ChatBlocks
                    message={msg}
                    onSuggestedReply={isLast ? handleSuggestedReply : undefined}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.inputBar,
              { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask Compass…"
              mode="outlined"
              style={styles.input}
              multiline
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              dense
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || status === 'streaming'}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    !input.trim() || status === 'streaming'
                      ? theme.colors.surfaceVariant
                      : theme.colors.primary,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    !input.trim() || status === 'streaming'
                      ? theme.colors.onSurfaceVariant
                      : theme.colors.onPrimary,
                  fontWeight: '600',
                }}
              >
                {status === 'streaming' ? '…' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  messageList: { padding: 16, gap: 12 },
  emptyState: { padding: 24, alignItems: 'center' },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  suggestionPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  assistantBlock: { maxWidth: '100%' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 120 },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
});
