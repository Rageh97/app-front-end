declare global {
  interface Window {
    openTawkToChat?: () => void;
    clientId1328?: string;
    NT_EXT_DETECTED?: boolean;
    freeToolsExtensionDetected?: boolean;
    globalAppsToolsData?: any;
    activeTool?: number;
    isLoaded?: boolean | null;
    isLoading?: boolean;
    isDataEnabled?: boolean;
  }

  var NT_EXT_DETECTED: boolean | undefined;
  var freeToolsExtensionDetected: boolean | undefined;
  var globalAppsToolsData: any;
  var activeTool: number;
  var isLoaded: boolean | null;
  var isLoading: boolean;
  var clientId1328: string;
  var isDataEnabled: boolean | undefined;
}

export {};