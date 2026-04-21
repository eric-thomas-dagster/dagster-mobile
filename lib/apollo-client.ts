import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ENV_CONFIG } from '../config/env';

// Dagster Cloud uses the legacy subscriptions-transport-ws protocol
// (frame types: connection_init / start / data / complete).
// Do not swap to graphql-ws — that's a different wire protocol.

export const buildGraphQLUrl = (organizationName: string, deploymentName: string) => {
  return `https://${organizationName}.dagster.cloud/${deploymentName}/graphql`;
};

const httpToWs = (url: string) => url.replace(/^http/, 'ws');

// Token is cached at module scope so the synchronous WebSocket constructor
// can inject it into the upgrade headers. Refreshed whenever getApiToken runs.
let cachedApiToken: string | null = null;

const getApiToken = async (): Promise<string | null> => {
  try {
    let apiToken = await SecureStore.getItemAsync('dagster_api_token');
    if (!apiToken) {
      apiToken = await AsyncStorage.getItem('dagster_api_token');
      if (apiToken) {
        await SecureStore.setItemAsync('dagster_api_token', apiToken);
        await AsyncStorage.removeItem('dagster_api_token');
      }
    }
    cachedApiToken = apiToken;
    return apiToken;
  } catch (error) {
    console.warn('Failed to get API token from storage:', error);
    return null;
  }
};

// Prime the cache so the very first WS handshake has a token available.
void getApiToken();

// Dagster Cloud's WebSocket endpoint gates the HTTP upgrade itself (returns
// 403 Forbidden without auth), so we must attach the Bearer token to the
// upgrade request — connection_init payload auth won't help, we never get there.
// React Native's WebSocket accepts `{ headers }` as a third constructor arg.
//
// The static OPEN/CLOSED/etc constants matter: subscriptions-transport-ws does
// `this.wsImpl.OPEN` in its send-queue switch statement. Without these, every
// case falls through to default and messages silently fail.
class AuthedWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor(url: string, protocols?: string | string[]) {
    const headers = cachedApiToken
      ? { Authorization: `Bearer ${cachedApiToken}` }
      : undefined;
    console.log(
      `[Compass] opening WS → ${url} (auth=${!!headers}, protocols=${JSON.stringify(
        protocols,
      )})`,
    );
    // @ts-ignore — RN's WebSocket accepts a 3rd-arg options bag (not in DOM types)
    const ws: WebSocket = new WebSocket(url, protocols, headers ? { headers } : undefined);
    ws.addEventListener('open', () =>
      console.log('[Compass] WS onopen (readyState=' + (ws as any).readyState + ')'),
    );
    ws.addEventListener('close', (ev: any) => {
      console.log(
        `[Compass] WS onclose code=${ev?.code} reason=${JSON.stringify(
          ev?.reason,
        )} wasClean=${ev?.wasClean}`,
      );
    });
    ws.addEventListener('error', (ev: any) => {
      console.log(
        '[Compass] WS onerror (readyState=' +
          (ws as any).readyState +
          ', message=' +
          JSON.stringify(ev?.message) +
          ')',
      );
    });
    ws.addEventListener('message', (ev: any) => {
      const d = ev?.data ?? ev;
      const s = typeof d === 'string' ? d : String(d);
      console.log('[Compass] WS ← ' + s.slice(0, 300));
    });
    const origSend = ws.send.bind(ws);
    (ws as any).send = (data: any) => {
      const s = typeof data === 'string' ? data : String(data);
      console.log('[Compass] WS → ' + s.slice(0, 300));
      return origSend(data);
    };
    return ws as any;
  }
}

const createDynamicHttpLink = (url: string) => {
  return createHttpLink({
    uri: url,
    fetchOptions: {
      timeout: 10000,
    },
  });
};

let currentSubscriptionClient: SubscriptionClient | null = null;

const createDynamicWsLink = (httpUrl: string) => {
  const wsUrl = httpToWs(httpUrl);
  console.log('[Compass] creating WS client for', wsUrl);
  const client = new SubscriptionClient(
    wsUrl,
    {
      lazy: true,
      reconnect: true,
      // Dagster Cloud's web UI authenticates WS upgrades via session cookie;
      // mobile doesn't have one, so we authenticate at the GraphQL layer via
      // connection_init payload. Sending under several common keys because
      // different server middlewares look in different places.
      connectionParams: async () => {
        const token = await getApiToken();
        if (!token) return {};
        return {
          Authorization: `Bearer ${token}`,
          authorization: `Bearer ${token}`,
          headers: { Authorization: `Bearer ${token}` },
        };
      },
    },
    AuthedWebSocket as unknown as typeof WebSocket,
  );

  client.onConnected(() => console.log('[Compass] WS connected'));
  client.onDisconnected(() => console.log('[Compass] WS disconnected'));
  client.onReconnected(() => console.log('[Compass] WS reconnected'));
  client.onError((err) => console.warn('[Compass] WS error:', err));

  if (currentSubscriptionClient) {
    try {
      currentSubscriptionClient.close();
    } catch (e) {
      // ignore
    }
  }
  currentSubscriptionClient = client;

  return new WebSocketLink(client);
};

const authLink = setContext(async (_, { headers }) => {
  const apiToken = await getApiToken();
  return {
    headers: {
      ...headers,
      authorization: apiToken ? `Bearer ${apiToken}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.warn(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.warn(`[Network error]: ${networkError}`);
  }
});

const buildLink = (url: string) => {
  const httpLink = createDynamicHttpLink(url);
  const wsLink = createDynamicWsLink(url);

  const transportLink = split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    from([authLink, httpLink])
  );

  return from([errorLink, transportLink]);
};

export const apolloClient = new ApolloClient({
  link: buildLink(ENV_CONFIG.DEFAULT_DAGSTER_URL),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          assetsOrError: { merge: false },
          jobsOrError: { merge: false },
          runsOrError: { merge: false },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
  },
});

export const updateApolloClientUrl = (organizationName: string, deploymentName: string) => {
  const newUrl = buildGraphQLUrl(organizationName, deploymentName);
  console.log('Updating Apollo client URL to:', newUrl);
  apolloClient.setLink(buildLink(newUrl));
  apolloClient.clearStore();
};

export const updateApolloClientWithSettings = async () => {
  try {
    const storedUrl = await AsyncStorage.getItem('dagster_api_url');
    if (storedUrl) {
      console.log('Updating Apollo client URL to stored setting:', storedUrl);
      apolloClient.setLink(buildLink(storedUrl));
      apolloClient.clearStore();
    }
  } catch (error) {
    console.warn('Failed to update Apollo client with stored settings:', error);
  }
};

export const getApolloClient = () => {
  return apolloClient;
};
