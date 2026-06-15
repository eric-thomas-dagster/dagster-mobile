import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { AssistantMessage, Block, formatToolLabel } from './types';
import { useTheme } from '../ThemeProvider';
import { ChartBlock } from './ChartBlock';

const DATA_VIZ_TOOL = 'TOOL_TYPE_RENDER_DATA_VISUALIZATION';

// Allow-list URL schemes before handing to Linking.openURL. Compass content
// is first-party but we don't want javascript:/file:/custom-app-deep-link
// schemes in case the response surface ever changes.
const SAFE_LINK_SCHEMES = ['http:', 'https:', 'mailto:'];
const handleLinkPress = (url: string): boolean => {
  try {
    const lowered = url.trim().toLowerCase();
    if (SAFE_LINK_SCHEMES.some((s) => lowered.startsWith(s))) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
  } catch {
    // fall through, don't open
  }
  return false;
};

type Props = {
  message: AssistantMessage;
  onSuggestedReply?: (reply: string) => void;
};

export const ChatBlocks: React.FC<Props> = ({ message, onSuggestedReply }) => {
  const { theme } = useTheme();

  return (
    <View>
      {message.blocks.map((block, idx) => (
        <BlockView key={idx} block={block} />
      ))}

      {message.streaming && message.blocks.length === 0 && (
        <View style={styles.row}>
          <ActivityIndicator size="small" />
          <Text style={[styles.thinking, { color: theme.colors.onSurfaceVariant }]}>
            Thinking…
          </Text>
        </View>
      )}

      {message.error && (
        <View style={[styles.errorBox, { borderColor: theme.colors.error }]}>
          <Text style={{ color: theme.colors.error }}>{message.error}</Text>
        </View>
      )}

      {!message.streaming && message.suggestedReplies.length > 0 && onSuggestedReply && (
        <View style={styles.chipRow}>
          {message.suggestedReplies.map((reply) => (
            <TouchableOpacity
              key={reply}
              onPress={() => onSuggestedReply(reply)}
              style={[
                styles.chip,
                { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  if (block.kind === 'text') {
    return (
      <Markdown
        style={buildMarkdownStyles(theme) as any}
        rules={markdownRules}
        onLinkPress={handleLinkPress}
      >
        {block.text}
      </Markdown>
    );
  }

  // Data-visualization tool: once the block is complete and we have a full
  // JSON payload, render a real chart instead of the generic tool card.
  if (block.toolType === DATA_VIZ_TOOL && block.complete && !block.error) {
    return <ChartBlock inputJson={block.inputJson} />;
  }

  const label = formatToolLabel(block.toolType);
  const statusIcon = block.error ? '⚠️' : block.complete ? '✓' : '…';
  const prettyJson = (() => {
    try {
      return JSON.stringify(JSON.parse(block.inputJson), null, 2);
    } catch {
      return block.inputJson;
    }
  })();

  return (
    <TouchableOpacity
      onPress={() => setExpanded((e) => !e)}
      style={[
        styles.toolCard,
        { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>
          {statusIcon} {label}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, marginLeft: 'auto' }}>
          {expanded ? 'tap to collapse' : 'tap to expand'}
        </Text>
      </View>
      {expanded && (
        <View style={styles.toolBody}>
          {block.error ? (
            <Text style={{ color: theme.colors.error, fontSize: 12 }}>{block.error}</Text>
          ) : null}
          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              fontSize: 11,
              fontFamily: 'Menlo',
            }}
          >
            {prettyJson || '(no input)'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Wide tables (e.g. 24-hour × 7-day matrices) squish to unreadable cells in
// the default flex layout. Wrap the table in a horizontal ScrollView, give the
// table an explicit width (>= available chat width) and let cells flex:1 within
// it — so narrow tables fill the row and columns align across rows, while wide
// tables overflow and scroll horizontally.
const TABLE_CELL_MIN_WIDTH = 64;

const countTableColumns = (node: any): number => {
  const findFirstRow = (n: any): any => {
    if (!n) return null;
    if (n.type === 'tr') return n;
    if (Array.isArray(n.children)) {
      for (const c of n.children) {
        const r = findFirstRow(c);
        if (r) return r;
      }
    }
    return null;
  };
  const tr = findFirstRow(node);
  if (!tr || !Array.isArray(tr.children)) return 1;
  const cells = tr.children.filter((c: any) => c.type === 'th' || c.type === 'td');
  return cells.length || tr.children.length || 1;
};

const TableRule: React.FC<{ node: any; styles: any; children: React.ReactNode }> = ({
  node,
  styles,
  children,
}) => {
  const [available, setAvailable] = React.useState(0);
  const cols = countTableColumns(node);
  const minTableWidth = cols * TABLE_CELL_MIN_WIDTH;
  const tableWidth = Math.max(minTableWidth, available);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w && w !== available) setAvailable(w);
      }}
    >
      <View style={[styles._VIEW_SAFE_table, { width: tableWidth }]}>{children}</View>
    </ScrollView>
  );
};

const markdownRules = {
  table: (node: any, children: React.ReactNode, _parent: any, styles: any) => (
    <TableRule key={node.key} node={node} styles={styles}>
      {children}
    </TableRule>
  ),
  th: (node: any, children: React.ReactNode, _parent: any, styles: any) => (
    <View key={node.key} style={[styles._VIEW_SAFE_th, { flex: 1 }]}>
      {children}
    </View>
  ),
  td: (node: any, children: React.ReactNode, _parent: any, styles: any) => (
    <View key={node.key} style={[styles._VIEW_SAFE_td, { flex: 1 }]}>
      {children}
    </View>
  ),
};

// Themed styles for react-native-markdown-display. Colors follow the app theme;
// code blocks use a monospace font and the surfaceVariant background.
const buildMarkdownStyles = (theme: any) => ({
  body: { color: theme.colors.onSurface, fontSize: 14, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 8, color: theme.colors.onSurface },
  heading1: { color: theme.colors.onSurface, fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  heading2: { color: theme.colors.onSurface, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  heading3: { color: theme.colors.onSurface, fontSize: 16, fontWeight: '700', marginTop: 6, marginBottom: 4 },
  strong: { fontWeight: '700', color: theme.colors.onSurface },
  em: { fontStyle: 'italic', color: theme.colors.onSurface },
  link: { color: theme.colors.primary, textDecorationLine: 'underline' },
  blockquote: {
    backgroundColor: theme.colors.surfaceVariant,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
    borderRadius: 4,
  },
  // Inline code: no background. A background pill looks fine in prose but
  // fills narrow table cells (the AI likes to wrap pipeline/asset names in
  // backticks, so table first-columns end up visually striped).
  code_inline: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: theme.colors.primary,
  },
  code_block: {
    fontFamily: 'Menlo',
    fontSize: 12,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.onSurfaceVariant,
    padding: 8,
    borderRadius: 4,
    marginVertical: 6,
  },
  fence: {
    fontFamily: 'Menlo',
    fontSize: 12,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.onSurfaceVariant,
    padding: 8,
    borderRadius: 4,
    marginVertical: 6,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  hr: {
    backgroundColor: theme.colors.outline,
    height: 1,
    marginVertical: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 4,
    marginVertical: 8,
  },
  thead: { backgroundColor: theme.colors.surfaceVariant },
  th: {
    padding: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.outline,
  },
  tr: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.outline, flexDirection: 'row' },
  td: {
    padding: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.outline,
  },
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinking: { fontSize: 13, fontStyle: 'italic' },
  errorBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toolCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 4,
  },
  toolBody: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#888',
  },
});
