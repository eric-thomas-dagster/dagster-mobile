/**
 * Utility functions for handling GraphQL errors, especially permission errors
 */

export interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    errorType?: string;
  };
}

export interface UnauthorizedError {
  message: string;
  __typename: 'UnauthorizedError';
}

/**
 * Check if an error is a permission/unauthorized error
 */
export const isPermissionError = (error: any): boolean => {
  if (!error) return false;
  
  // Check GraphQL error structure
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    
    // Check for UnauthorizedError type
    if (graphQLError.extensions?.errorType === 'UnauthorizedError' || 
        graphQLError.extensions?.code === 'UNAUTHORIZED' ||
        graphQLError.message?.toLowerCase().includes('unauthorized') ||
        graphQLError.message?.toLowerCase().includes('permission')) {
      return true;
    }
  }
  
  // Check for UnauthorizedError in response data
  if (error.data) {
    const dataKeys = Object.keys(error.data);
    for (const key of dataKeys) {
      const value = error.data[key];
      if (value?.__typename === 'UnauthorizedError' || 
          value?.message?.toLowerCase().includes('unauthorized') ||
          value?.message?.toLowerCase().includes('permission')) {
        return true;
      }
    }
  }
  
  // Check error message directly
  const errorMessage = error.message || error.toString();
  if (errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('permission') ||
      errorMessage.toLowerCase().includes('forbidden')) {
    return true;
  }
  
  return false;
};

/**
 * Get a user-friendly error message for permission errors
 */
export const getPermissionErrorMessage = (action: string): string => {
  return `You don't have permission to ${action}. This action requires organization admin permissions.`;
};

/**
 * Extract error message from various error formats
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  // Check GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    if (graphQLError.message) {
      return graphQLError.message;
    }
  }
  
  // Check network errors
  if (error.networkError) {
    return error.networkError.message || 'Network error occurred';
  }
  
  // Check data errors (UnauthorizedError, etc.)
  if (error.data) {
    const dataKeys = Object.keys(error.data);
    for (const key of dataKeys) {
      const value = error.data[key];
      if (value?.message) {
        return value.message;
      }
      if (value?.__typename === 'UnauthorizedError' && value.message) {
        return value.message;
      }
    }
  }
  
  // Fallback to error message
  return error.message || error.toString() || 'An unknown error occurred';
};

