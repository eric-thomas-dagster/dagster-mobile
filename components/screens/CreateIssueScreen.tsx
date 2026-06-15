import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@apollo/client';
import { CREATE_ISSUE, GET_ISSUES } from '../../lib/graphql/queries';
import { Issue } from '../../lib/types/dagster';
import { useTheme } from '../ThemeProvider';
import { useToast } from '../ToastProvider';

interface CreateIssueScreenProps {
  navigation: any;
  route: {
    params?: {
      runId?: string;
      pipelineName?: string;
      runStatus?: string;
    };
  };
}

type CreateIssueResult = {
  createIssue: {
    __typename: 'CreateIssueSuccess' | 'UnauthorizedError' | 'PythonError';
    issue?: Issue;
    message?: string;
  };
};

const CreateIssueScreen: React.FC<CreateIssueScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { runId, pipelineName, runStatus } = route.params ?? {};

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');

  // Pre-fill the description with a short auto-summary so the user has somewhere
  // to start, but leave the title blank — the user should phrase that themselves.
  React.useEffect(() => {
    if (runId && !description) {
      const summary =
        runStatus && pipelineName
          ? `Run \`${runId.slice(0, 8)}\` of job \`${pipelineName}\` ended with status \`${runStatus}\`.\n\n`
          : '';
      setDescription(summary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, runStatus, pipelineName]);

  const [createIssue, { loading }] = useMutation<CreateIssueResult>(CREATE_ISSUE, {
    refetchQueries: [{ query: GET_ISSUES }],
    awaitRefetchQueries: false,
  });

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const canSubmit = !loading && trimmedTitle.length > 0 && trimmedDescription.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const result = await createIssue({
        variables: {
          title: trimmedTitle,
          description: trimmedDescription,
          origin: runId ? { runId } : null,
          chatId: null,
        },
      });
      const payload = result.data?.createIssue;
      if (!payload) {
        showToast('Could not create issue', 'error');
        return;
      }
      if (payload.__typename === 'CreateIssueSuccess' && payload.issue) {
        showToast(`Issue #${payload.issue.publicId} created`, 'success');
        navigation.replace('IssueDetail', { issue: payload.issue });
        return;
      }
      showToast(payload.message || 'Could not create issue', 'error');
    } catch (e: any) {
      showToast(e?.message || 'Could not create issue', 'error');
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {runId && (
            <Card style={[styles.linkedCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content>
                <Text style={[styles.linkedLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Linked to run
                </Text>
                <Text style={[styles.linkedRun, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {runId.slice(0, 8)}
                  {pipelineName ? `  ·  ${pipelineName}` : ''}
                </Text>
              </Card.Content>
            </Card>
          )}

          <TextInput
            label="Title"
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            maxLength={200}
            autoFocus
            returnKeyType="next"
          />

          <TextInput
            label="Description"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={8}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
            style={styles.submit}
          >
            Create issue
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.cancel}
          >
            Cancel
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  linkedCard: { marginBottom: 16 },
  linkedLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  linkedRun: { fontSize: 14, fontWeight: '600' },
  input: { marginBottom: 12 },
  submit: { marginTop: 12 },
  cancel: { marginTop: 4 },
});

export default CreateIssueScreen;
