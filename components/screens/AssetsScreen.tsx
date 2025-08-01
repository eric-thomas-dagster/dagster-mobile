import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Searchbar, SegmentedButtons, Menu, Button } from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { GET_ASSETS, GET_CATALOG_VIEWS, GET_USER_FAVORITE_ASSETS, GET_ASSET_DEPENDENCIES } from '../../lib/graphql/queries';
import { RepositorySelector, Asset, CatalogView, UserFavoriteAsset } from '../../lib/types/dagster';
import { formatDagsterDate } from '../../lib/utils/dateUtils';
import { useTheme } from '../ThemeProvider';
import Svg, { Path } from 'react-native-svg';

interface AssetsScreenProps {
  navigation: any;
}

// Asset Icon Component
const AssetIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M3.20801 17.7917C2.65573 17.7917 2.20801 17.344 2.20801 16.7917V3.1875C2.20801 2.63522 2.65573 2.1875 3.20801 2.1875H16.8122C17.3645 2.1875 17.8122 2.63522 17.8122 3.1875V16.7917C17.8122 17.344 17.3645 17.7917 16.8122 17.7917H3.20801ZM3.85385 6.9375H16.1456V3.85417H3.85385V6.9375ZM8.37468 11.5417H11.6247V8.1875H8.37468V11.5417ZM8.37468 16.1458H11.6247V12.7917H8.37468V16.1458ZM3.85385 11.5417H7.12468V8.1875H3.85385V11.5417ZM12.8747 11.5417H16.1456V8.1875H12.8747V11.5417ZM3.85385 16.1458H7.12468V12.7917H3.85385V16.1458ZM12.8747 16.1458H16.1456V12.7917H12.8747V16.1458Z"
      fill={color}
    />
  </Svg>
);

// Health Status Icon Components
const HealthyIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.0001 14.4C11.5347 14.4 14.4001 11.5346 14.4001 8.00001C14.4001 4.46538 11.5347 1.60001 8.0001 1.60001C4.46548 1.60001 1.6001 4.46538 1.6001 8.00001C1.6001 11.5346 4.46548 14.4 8.0001 14.4ZM11.8011 7.00898C12.0194 6.75959 11.9941 6.38054 11.7447 6.16233C11.4953 5.94413 11.1163 5.9694 10.898 6.21878L8.98859 8.40107L7.57531 6.28114C7.47171 6.12575 7.30167 6.02746 7.1153 6.01525C6.92895 6.00304 6.74753 6.07831 6.62455 6.21886L4.19895 8.99085C3.98075 9.24023 4.00601 9.61929 4.25538 9.83753C4.50476 10.0557 4.88383 10.0305 5.10203 9.78105L7.01155 7.59885L8.42485 9.71881C8.52845 9.87417 8.6985 9.97249 8.88487 9.98465C9.07123 9.99689 9.25265 9.92161 9.37563 9.78105L11.8011 7.00898Z"
      fill="#25A46C"
    />
  </Svg>
);

const WarningIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.0001 14.4C11.5347 14.4 14.4001 11.5346 14.4001 8.00001C14.4001 4.46538 11.5347 1.60001 8.0001 1.60001C4.46548 1.60001 1.6001 4.46538 1.6001 8.00001C1.6001 11.5346 4.46548 14.4 8.0001 14.4ZM9.81034 4.83473C9.67666 4.70102 9.48775 4.63817 9.30059 4.66513C9.11342 4.69208 8.94992 4.80568 8.85938 4.97169L6.47136 9.34972L5.19038 8.06873C4.95606 7.83441 4.57616 7.83441 4.34185 8.06873C4.10754 8.30305 4.10754 8.68294 4.34185 8.91726L6.18985 10.7653C6.32356 10.899 6.51247 10.9618 6.69963 10.9349C6.8868 10.9079 7.0503 10.7943 7.14085 10.6283L9.52886 6.25028L10.8099 7.53126C11.0442 7.76557 11.4241 7.76557 11.6583 7.53126C11.8927 7.29694 11.8927 6.91705 11.6583 6.68273L9.81034 4.83473Z"
      fill="#E59D2F"
    />
  </Svg>
);

const DegradedIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.0001 14.4C11.5347 14.4 14.4001 11.5346 14.4001 8C14.4001 4.46538 11.5347 1.6 8.0001 1.6C4.46548 1.6 1.6001 4.46538 1.6001 8C1.6001 11.5346 4.46548 14.4 8.0001 14.4ZM11.8011 8.99093C12.0194 9.24032 11.9941 9.61936 11.7447 9.8376C11.4953 10.0558 11.1163 10.0305 10.898 9.78112L8.98859 7.59884L7.57531 9.7188C7.47171 9.87416 7.30167 9.97248 7.1153 9.98464C6.92895 9.99688 6.74753 9.9216 6.62455 9.78104L4.19895 7.00906C3.98075 6.75968 4.00601 6.38062 4.25538 6.1624C4.50476 5.9442 4.88383 5.96946 5.10203 6.21884L7.01155 8.40107L8.42485 6.28112C8.52845 6.12573 8.6985 6.02744 8.88487 6.01523C9.07123 6.00302 9.25265 6.07829 9.37563 6.21885L11.8011 8.99093Z"
      fill="#D24235"
    />
  </Svg>
);

const AssetsScreen: React.FC<AssetsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [healthFilter, setHealthFilter] = React.useState<'all' | 'healthy' | 'degraded' | 'warning'>('all');
  const [selectedView, setSelectedView] = React.useState<'all' | 'favorites' | string>('all');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [dependencyCache, setDependencyCache] = React.useState<Record<string, any>>({});
  const [pendingDependencyFetches, setPendingDependencyFetches] = React.useState<Set<string>>(new Set());
  const hasPreFetchedRef = React.useRef(false);
  
  const { data, loading, refetch, error } = useQuery(GET_ASSETS, {
    errorPolicy: 'all',
  });

  const { data: catalogViewsData } = useQuery(GET_CATALOG_VIEWS, {
    errorPolicy: 'all',
  });

  const { data: favoritesData } = useQuery(GET_USER_FAVORITE_ASSETS, {
    errorPolicy: 'all',
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAssetPress = (asset: Asset) => {
    // Remove __typename from the asset key to match AssetKeyInput type
    const assetKeyInput = {
      path: asset.key?.path || []
    };
    navigation.navigate('AssetDetail', { assetKey: assetKeyInput });
  };

  const getAssetHealth = (asset: Asset) => {
    if (!asset.assetHealth) return 'Unknown';
    return asset.assetHealth.assetHealth || 'Unknown';
  };

  const getHealthIcon = (health: string) => {
    switch (health.toUpperCase()) {
      case 'HEALTHY':
        return <HealthyIcon size={16} />;
      case 'WARNING':
        return <WarningIcon size={16} />;
      case 'DEGRADED':
        return <DegradedIcon size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'HEALTHY': return '#25A46C';
      case 'WARNING': return '#E59D2F';
      case 'DEGRADED': return '#D24235';
      default: return '#6B7280';
    }
  };

  const formatAssetPath = (path: string[]) => {
    return path.join(' / ');
  };

  const getAssetKinds = (asset: Asset) => {
    if (!asset.definition?.metadataEntries) return [];
    
    const kinds: string[] = [];
    asset.definition.metadataEntries.forEach((entry: any) => {
      if (entry.type === 'TableMetadataEntry' && entry.table?.schema?.columns) {
        entry.table.schema.columns.forEach((column: any) => {
          if (column.tags && column.tags.length > 0) {
            kinds.push(...column.tags);
          }
        });
      }
    });
    
    return [...new Set(kinds)];
  };

  const getSelectedViewName = () => {
    if (selectedView === 'all') return 'All Assets';
    if (selectedView === 'favorites') return 'Favorites';
    
    const catalogViews = catalogViewsData?.catalogViews;
    if (catalogViews) {
      const view = catalogViews.find((v: CatalogView) => v.id === selectedView);
      return view ? view.name : 'All Assets';
    }
    return 'All Assets';
  };

  const isAssetInFavorites = (asset: Asset) => {
    const favorites = favoritesData?.userFavoriteAssets;
    if (!favorites || !asset.key?.path) return false;
    
    return favorites.some((fav: UserFavoriteAsset) => {
      if (!fav.path || !asset.key?.path) return false;
      if (fav.path.length !== asset.key.path.length) return false;
      return fav.path.every((segment: string, index: number) => segment === asset.key?.path?.[index]);
    });
  };

  const fetchAssetDependencies = async (assetKey: string[]) => {
    const keyString = assetKey.join('.');
    
    // Check cache first
    if (dependencyCache[keyString]) {
      return dependencyCache[keyString];
    }
    
    // Check if already fetching
    if (pendingDependencyFetches.has(keyString)) {
      return null;
    }
    
    try {
      setPendingDependencyFetches(prev => new Set(prev).add(keyString));
      
      const { data } = await refetch({
        query: GET_ASSET_DEPENDENCIES,
        variables: { assetKey: { path: assetKey } }
      });
      
      if (data?.assetNodeOrError?.__typename === 'AssetNode') {
        const result = {
          dependencies: data.assetNodeOrError.dependencies?.map((dep: any) => dep.asset.assetKey.path) || [],
          dependedBy: data.assetNodeOrError.dependedBy?.map((dep: any) => dep.asset.assetKey.path) || []
        };
        
        setDependencyCache(prev => ({ ...prev, [keyString]: result }));
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching dependencies for', keyString, error);
      return null;
    } finally {
      setPendingDependencyFetches(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyString);
        return newSet;
      });
    }
  };

  const preFetchDependencies = async (assets: Asset[]) => {
    if (hasPreFetchedRef.current) return;
    
    const assetsWithDependencyFilters = assets.filter(asset => {
      const catalogViews = catalogViewsData?.catalogViews;
      if (!catalogViews) return false;
      
      const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
      if (!selectedCatalogView?.selection?.querySelection) return false;
      
      return selectedCatalogView.selection.querySelection.includes('+');
    });
    
    if (assetsWithDependencyFilters.length === 0) return;
    
    hasPreFetchedRef.current = true;
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < assetsWithDependencyFilters.length; i += batchSize) {
      const batch = assetsWithDependencyFilters.slice(i, i + batchSize);
      await Promise.all(batch.map(asset => 
        fetchAssetDependencies(asset.key?.path || [])
      ));
      
      // Small delay between batches
      if (i + batchSize < assetsWithDependencyFilters.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const matchesCatalogViewSelection = (asset: Asset) => {
    const catalogViews = catalogViewsData?.catalogViews;
    if (!catalogViews) return true;
    
    const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
    if (!selectedCatalogView) return true;
    
    const selection = selectedCatalogView.selection;
    
    // Check basic filters
    if (selection.kinds && selection.kinds.length > 0) {
      const assetKinds = getAssetKinds(asset);
      if (!selection.kinds.some((kind: string) => assetKinds.includes(kind))) {
        return false;
      }
    }
    
    if (selection.tags && selection.tags.length > 0) {
      const assetTags = asset.definition?.tags?.map((tag: any) => tag.key) || [];
      if (!selection.tags.some((tag: string) => assetTags.includes(tag))) {
        return false;
      }
    }
    
    if (selection.groups && selection.groups.length > 0) {
      const assetGroup = asset.definition?.groupName;
      if (!selection.groups.includes(assetGroup)) {
        return false;
      }
    }
    
    if (selection.tableNames && selection.tableNames.length > 0) {
      const assetTableName = asset.definition?.metadataEntries?.find((entry: any) => 
        entry.type === 'TableMetadataEntry'
      )?.table?.name;
      if (!selection.tableNames.includes(assetTableName)) {
        return false;
      }
    }
    
    // Handle querySelection
    if (selection.querySelection) {
      const query = selection.querySelection.trim();
      if (query) {
        // Split by 'or' but be smart about quoted strings
        const orConditions = query.split(/\s+or\s+/).map((condition: string) => condition.trim());
        
        // If we have multiple conditions, at least one must match
        const anyConditionMatches = orConditions.some((condition: string) => {
          // Split by 'AND' but be smart about quoted strings
          const andConditions = condition.split(/\s+and\s+/i).map((andCondition: string) => andCondition.trim());
          
                      // All AND conditions must match
            return andConditions.every((andCondition: string) => {
            if (andCondition.includes('kind:')) {
              const kind = andCondition.split('kind:')[1].replace(/"/g, '').trim();
              const assetKinds = getAssetKinds(asset);
              return assetKinds.includes(kind);
            }
            
            if (andCondition.includes('group:')) {
              const group = andCondition.split('group:')[1].replace(/"/g, '').trim();
              return asset.definition?.groupName === group;
            }
            
            if (andCondition.includes('tag:')) {
              const tag = andCondition.split('tag:')[1].replace(/"/g, '').trim();
              const assetTags = asset.definition?.tags?.map((tag: any) => tag.key) || [];
              return assetTags.includes(tag);
            }
            
            if (andCondition.includes('owner:')) {
              const owner = andCondition.split('owner:')[1].replace(/"/g, '').trim();
              const assetOwner = asset.definition?.metadataEntries?.find((entry: any) => 
                entry.type === 'TextMetadataEntry' && entry.textLabel === 'owner'
              )?.text;
              return assetOwner === owner;
            }
            
            if (andCondition.includes('table_name:')) {
              const tableName = andCondition.split('table_name:')[1].replace(/"/g, '').trim();
              const assetTableName = asset.definition?.metadataEntries?.find((entry: any) => 
                entry.type === 'TableMetadataEntry'
              )?.table?.name;
              return assetTableName === tableName;
            }
            
            if (andCondition.includes('column:')) {
              const column = andCondition.split('column:')[1].replace(/"/g, '').trim();
              const assetColumns = asset.definition?.metadataEntries?.find((entry: any) => 
                entry.type === 'TableMetadataEntry'
              )?.table?.schema?.columns?.map((col: any) => col.name) || [];
              return assetColumns.includes(column);
            }
            
            if (andCondition.includes('column_tag:')) {
              const columnTag = andCondition.split('column_tag:')[1].replace(/"/g, '').trim();
              const assetColumnTags = asset.definition?.metadataEntries?.find((entry: any) => 
                entry.type === 'TableMetadataEntry'
              )?.table?.schema?.columns?.flatMap((col: any) => col.tags || []) || [];
              return assetColumnTags.includes(columnTag);
            }
            
            // Handle dependency syntax: +key: and key:+
            if (andCondition.includes('+key:')) {
              const key = andCondition.split('+key:')[1].replace(/"/g, '').trim();
              const assetKeyString = asset.key?.path?.join('.') || '';
              const dependencies = dependencyCache[assetKeyString];
              if (!dependencies) return false;
              return dependencies.dependencies.some((depPath: string[]) => 
                depPath.join('.').includes(key.replace('*', '.*'))
              );
            }
            
            if (andCondition.includes('key:+')) {
              const key = andCondition.split('key:+')[1].replace(/"/g, '').trim();
              const assetKeyString = asset.key?.path?.join('.') || '';
              const dependencies = dependencyCache[assetKeyString];
              if (!dependencies) return false;
              return dependencies.dependedBy.some((depPath: string[]) => 
                depPath.join('.').includes(key.replace('*', '.*'))
              );
            }
            
            return true; // If we don't recognize the condition, assume it matches
          });
        });
        
        if (!anyConditionMatches) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Pre-fetch dependencies when a view with + syntax is selected
  React.useEffect(() => {
    if (selectedView !== 'all' && selectedView !== 'favorites' && data?.assetsOrError?.nodes) {
      const catalogViews = catalogViewsData?.catalogViews;
      if (catalogViews) {
        const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
        if (selectedCatalogView?.selection?.querySelection?.includes('+')) {
          hasPreFetchedRef.current = false;
          preFetchDependencies(data.assetsOrError.nodes);
        }
      }
    }
  }, [selectedView, data?.assetsOrError?.nodes, catalogViewsData?.catalogViews]);

  const filteredAssets = React.useMemo(() => {
    if (!data?.assetsOrError?.nodes) return [];
    
    let assets = data.assetsOrError.nodes;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      assets = assets.filter((asset: Asset) => {
        const path = formatAssetPath(asset.key?.path || []).toLowerCase();
        const description = asset.definition?.description?.toLowerCase() || '';
        return path.includes(query) || description.includes(query);
      });
    }
    
    // Apply health filter
    if (healthFilter !== 'all') {
      assets = assets.filter((asset: Asset) => {
        const health = getAssetHealth(asset).toLowerCase();
        return health === healthFilter;
      });
    }
    
    // Apply view filter
    if (selectedView === 'favorites') {
      assets = assets.filter((asset: Asset) => isAssetInFavorites(asset));
    } else if (selectedView !== 'all') {
      assets = assets.filter((asset: Asset) => matchesCatalogViewSelection(asset));
    }
    
    return assets;
  }, [data?.assetsOrError?.nodes, searchQuery, healthFilter, selectedView, catalogViewsData?.catalogViews, favoritesData?.userFavoriteAssets, dependencyCache]);

  const renderAssetItem = ({ item }: { item: Asset }) => {
    const health = getAssetHealth(item);
    const healthIcon = getHealthIcon(health);
    const statusColor = getStatusColor(health);
    const path = formatAssetPath(item.key?.path || []);
    const description = item.definition?.description || 'No description available';
    const kinds = getAssetKinds(item);

    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleAssetPress(item)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.assetInfo}>
              <View style={styles.assetIconContainer}>
                <AssetIcon color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.assetDetails}>
                <Title style={[styles.assetTitle, { color: theme.colors.onSurface }]}>
                  {path}
                </Title>
                <Paragraph style={[styles.assetDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {description}
                </Paragraph>
                {kinds.length > 0 && (
                  <View style={styles.kindsContainer}>
                    {kinds.slice(0, 3).map((kind, index) => (
                      <Text key={index} style={[styles.kindTag, { backgroundColor: theme.colors.primaryContainer, color: theme.colors.onPrimaryContainer }]}>
                        {kind}
                      </Text>
                    ))}
                    {kinds.length > 3 && (
                      <Text style={[styles.kindTag, { backgroundColor: theme.colors.primaryContainer, color: theme.colors.onPrimaryContainer }]}>
                        +{kinds.length - 3}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.healthContainer}>
              {healthIcon}
              <Text style={[styles.healthText, { color: statusColor }]}>
                {health}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error loading assets: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search assets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.onSurfaceVariant}
        />
        
        <View style={styles.filterContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.viewButton}
                textColor={theme.colors.onSurface}
              >
                {getSelectedViewName()}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSelectedView('all');
                setMenuVisible(false);
              }}
              title="All Assets"
            />
            <Menu.Item
              onPress={() => {
                setSelectedView('favorites');
                setMenuVisible(false);
              }}
              title="Favorites"
            />
            {catalogViewsData?.catalogViews?.map((view: CatalogView) => (
              <Menu.Item
                key={view.id}
                onPress={() => {
                  setSelectedView(view.id);
                  setMenuVisible(false);
                }}
                title={view.name}
              />
            ))}
          </Menu>
          
          <SegmentedButtons
            value={healthFilter}
            onValueChange={setHealthFilter as (value: string) => void}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'healthy', label: 'Healthy' },
              { value: 'warning', label: 'Warning' },
              { value: 'degraded', label: 'Degraded' },
            ]}
            style={styles.healthFilter}
          />
        </View>
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.key?.path?.join('.') || item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewButton: {
    flex: 1,
  },
  healthFilter: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assetInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  assetIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  assetDetails: {
    flex: 1,
  },
  assetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  assetDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  kindsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  kindTag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  healthContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  healthText: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    textAlign: 'center',
    margin: 16,
  },
});

export default AssetsScreen; 