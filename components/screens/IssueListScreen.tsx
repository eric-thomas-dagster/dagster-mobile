import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_ISSUES } from '../../lib/graphql/queries';
import { Issue, IssueListResponse, IssueStatus } from '../../lib/types/dagster';
import { useTheme } from '../ThemeProvider';
import EmptyState from '../EmptyState';
import { CardSkeletonList } from '../SkeletonLoader';
import { useToast } from '../ToastProvider';

interface IssueListScreenProps {
  navigation: any;
}

const statusPalette = (status: IssueStatus, theme: any): { bg: string; fg: string } => {
  const upper = (status || '').toUpperCase();
  if (upper === 'OPEN' || upper === 'IN_PROGRESS') {
    return { bg: theme.dark ? '#3d2a1a' : '#fff3e0', fg: theme.dark ? '#ffb74d' : '#e65100' };
  }
  if (upper === 'RESOLVED' || upper === 'CLOSED') {
    return { bg: theme.dark ? '#1f3a24' : '#e8f5e9', fg: theme.dark ? '#81c784' : '#1b5e20' };
  }
  if (upper === 'CANCELED' || upper === 'CANCELLED') {
    return { bg: theme.colors.surfaceVariant, fg: theme.colors.onSurfaceVariant };
  }
  return { bg: theme.colors.surfaceVariant, fg: theme.colors.onSurfaceVariant };
};

const formatStatusLabel = (status: string) => {
  if (status === 'ALL') return 'All';
  // Title-case the rest: "IN_PROGRESS" → "In progress"
  return status
    .toLowerCase()
    .split('_')
    .map((part, i) => (i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
};

const IssueListScreen: React.FC<IssueListScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = React.useState(false);
  // Default to OPEN — actionable subset is what users typically want to triage.
  const [selectedStatus, setSelectedStatus] = React.useState<string>('OPEN');
  const [statusMenuVisible, setStatusMenuVisible] = React.useState(false);

  const { data, loading, error, refetch } = useQuery<IssueListResponse>(GET_ISSUES, {
    errorPolicy: 'all',
  });

  const issues: Issue[] = data?.issues?.issues ?? [];

  // Compute the status filter options dynamically from the data so we surface
  // whatever statuses the backend actually emits — including any new ones the
  // API may add later (e.g. RESOLVED) without a code change.
  const allStatuses = React.useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.status) set.add(String(i.status));
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [issues]);

  const filteredIssues = React.useMemo(() => {
    if (selectedStatus === 'ALL') return issues;
    return issues.filter((i) => i.status === selectedStatus);
  }, [issues, selectedStatus]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      showToast('Failed to refresh issues', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [refetch, showToast]);

  const renderItem = ({ item }: { item: Issue }) => {
    const pill = statusPalette(item.status, theme);
    const author = item.createdBy?.displayName || item.createdBy?.email || 'Unknown';
    const linkedRun = item.linkedObjects?.[0];
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('IssueDetail', { issue: item })}
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={[styles.publicId, { color: theme.colors.onSurfaceVariant }]}>
                #{item.publicId}
              </Text>
              <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                <Text style={[styles.pillText, { color: pill.fg }]}>{item.status}</Text>
              </View>
            </View>
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text
                style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {author}
              </Text>
              {linkedRun && (
                <Text
                  style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  · run {linkedRun.runId.slice(0, 8)}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && issues.length === 0) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <CardSkeletonList count={5} />
      </SafeAreaView>
    );
  }

  if (error && issues.length === 0) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <EmptyState
          icon="error-outline"
          title="Couldn't load issues"
          description={error.message}
          actionLabel="Try again"
          onActionPress={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const filtersActive = selectedStatus !== 'ALL';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => setStatusMenuVisible(true)}
          textColor={theme.colors.onSurface}
          icon="chevron-down"
          style={styles.statusButton}
        >
          {`Status: ${formatStatusLabel(selectedStatus)}`}
        </Button>
      </View>

      <Modal
        visible={statusMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusMenuVisible(false)}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={allStatuses}
              keyExtractor={(s) => s}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedStatus(item);
                    setStatusMenuVisible(false);
                  }}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: theme.colors.outlineVariant },
                    selectedStatus === item && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { color: theme.colors.onSurface },
                      selectedStatus === item && { color: theme.colors.onPrimaryContainer },
                    ]}
                  >
                    {formatStatusLabel(item)}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredIssues}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={filteredIssues.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          filtersActive ? (
            <EmptyState
              icon="search-off"
              title="No matching issues"
              description={`No issues with status "${formatStatusLabel(selectedStatus)}".`}
              actionLabel="Clear filter"
              onActionPress={() => setSelectedStatus('ALL')}
            />
          ) : (
            <EmptyState
              icon="inbox"
              title="No issues"
              description="Issues filed in Dagster+ will appear here."
            />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContainer: { padding: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  card: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  publicId: { fontSize: 12, fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meta: { fontSize: 12 },
  header: { paddingHorizontal: 12, paddingVertical: 8 },
  statusButton: { alignSelf: 'flex-start' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 8 },
  modalList: { flexGrow: 0 },
  modalItem: { padding: 16, borderBottomWidth: 1 },
  modalItemText: { fontSize: 16 },
});

export default IssueListScreen;
