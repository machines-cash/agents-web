export type AgentBridgeSuccessMessage = {
  type: "success";
  state: string;
  exchangeToken: string;
  expiresAt: string;
};

export type AgentBridgeErrorCode =
  | "invalid_request"
  | "invalid_target_origin"
  | "not_authenticated"
  | "exchange_failed"
  | "network_error"
  | "popup_blocked"
  | "timeout";

export type AgentBridgeErrorMessage = {
  type: "error";
  state: string;
  code: AgentBridgeErrorCode;
  message: string;
};

export type AgentBridgeMessage = AgentBridgeSuccessMessage | AgentBridgeErrorMessage;

export type AgentUserSnapshot = {
  id: string | null;
  walletAddress: string;
  kycStatus: string | null;
  onboardingStatus: string | null;
  termsAcceptedAt: string | null;
};

export type AgentAuthProvider =
  | "machines_bridge"
  | "machines_connect"
  | "wallet_injected"
  | "bankr_sdk";

export type AgentSession = {
  agentSessionToken: string;
  agentSessionId: string;
  consumerSessionId: string;
  expiresAt: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  refreshSessionId?: string;
  clientId?: string;
  scopes: string[];
  user: AgentUserSnapshot;
  authProvider?: AgentAuthProvider;
};

export type AgentSessionRefreshResponse = AgentSession;

export type AgentLogoutResponse = {
  ok: true;
};

export type AgentKycLink = {
  url: string;
  params?: Record<string, string>;
};

export type AgentKycStatusResponse = {
  userId: string | null;
  status: string;
  reason: string | null;
  completionLink: AgentKycLink | null;
  externalVerificationLink: AgentKycLink | null;
  isActive: boolean | null;
  isTermsOfServiceAccepted: boolean;
};

export type AgentKycApplicationPayload = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId?: string;
  countryOfIssue: string;
  email: string;
  occupation: string;
  annualSalary: string;
  accountPurpose: string;
  expectedMonthlyVolume: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
    country?: string;
  };
  phoneCountryCode?: string;
  phoneNumber?: string;
};

export type AgentKycAgreementsPayload = {
  accepted: true;
};

export type AgentBankrConnectResponse = AgentSession;

export type AgentBankrExportResponse = {
  walletAddress: string;
  privateKey: string;
  exportedAt: string;
};

export type AgentToolCallEvent = {
  type: "tool_call";
  name: string;
  status: "success" | "error";
  detail?: string;
};

export type AgentPurchaseConfirmationEvent = {
  type: "requires_purchase_confirmation";
  actionId: string;
  expiresAt: string;
  summary: string;
};

export type AgentPurchaseStartedEvent = {
  type: "purchase_started";
  workflowId?: string;
};

export type AgentPurchaseProgressStatus =
  | "pending"
  | "processing"
  | "awaiting_3ds"
  | "completed"
  | "failed"
  | "expired";

export type AgentPurchaseProgressStepId = "step_1" | "step_2" | "step_3";

export type AgentPurchaseProgressStepState =
  | "pending"
  | "active"
  | "completed"
  | "failed";

export type AgentPurchaseProgressStep = {
  id: AgentPurchaseProgressStepId;
  label: string;
  state: AgentPurchaseProgressStepState;
  detail?: string | null;
};

export type AgentPurchaseProgress = {
  status: AgentPurchaseProgressStatus;
  currentStepId: AgentPurchaseProgressStepId;
  steps: AgentPurchaseProgressStep[];
  detail?: string | null;
};

export type AgentBillingSummary = {
  name: string;
  email: string;
  addressLine1Masked: string;
  city: string;
  state: string;
  postalCodeMasked: string;
  country: string;
};

export type AgentBillingDetails = {
  name: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AgentPurchaseProgressEvent = {
  type: "purchase_progress";
  progress: AgentPurchaseProgress;
};

export type AgentPurchaseResultEvent = {
  type: "purchase_result";
  status: string;
  orderId?: string | null;
  message?: string;
};

export type AgentUnsupportedOperationEvent = {
  type: "unsupported_operation";
  reason: string;
};

export type AgentKycStage =
  | "collecting_fields"
  | "submitting_application"
  | "awaiting_verification"
  | "awaiting_review"
  | "awaiting_agreements"
  | "completed";

export type AgentKycProgressEvent = {
  type: "kyc_progress";
  stage: AgentKycStage;
  status: string;
  nextPrompt?: string | null;
  missingFields?: string[];
};

export type AgentKycActionRequiredEvent = {
  type: "kyc_action_required";
  status: string;
  message: string;
  verificationUrl?: string | null;
};

export type AgentKycCompleteEvent = {
  type: "kyc_complete";
  status: "approved";
};

export type AgentCatalogItem = {
  title: string;
  price: string | null;
  imageUrl: string | null;
  url: string | null;
  asin: string | null;
  rating: number | null;
  reviewCount: number | null;
};

export type AgentCatalogResultsEvent = {
  type: "catalog_results";
  items: AgentCatalogItem[];
};

export type ChatEventEnvelope =
  | AgentToolCallEvent
  | AgentPurchaseConfirmationEvent
  | AgentPurchaseStartedEvent
  | AgentPurchaseProgressEvent
  | AgentPurchaseResultEvent
  | AgentUnsupportedOperationEvent
  | AgentCatalogResultsEvent
  | AgentKycProgressEvent
  | AgentKycActionRequiredEvent
  | AgentKycCompleteEvent;

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  redacted?: boolean;
};

export type AgentPendingAction = {
  id: string;
  type: string;
  status: string;
  expiresAt: string;
  confirmedAt: string | null;
  workflowId?: string | null;
  orderId?: string | null;
  quoteId?: string | null;
  paymentStatus?: string | null;
  message?: string | null;
  billingSummary?: AgentBillingSummary | null;
  billingDetails?: AgentBillingDetails | null;
  progress?: AgentPurchaseProgress | null;
};

export type AgentChatSessionCreateResponse = {
  chatSessionId: string;
  status: string;
  expiresAt: string;
  title: string | null;
};

export type AgentChatSessionListEntry = {
  chatSessionId: string;
  status: string;
  createdAt: string;
  lastMessageAt: string | null;
  title: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  archivedAt: string | null;
};

export type AgentChatSessionListResponse = {
  sessions: AgentChatSessionListEntry[];
  nextCursor: string | null;
};

export type AgentChatSessionUpdateResponse = AgentChatSessionListEntry;

export type AgentChatSessionDeleteResponse = {
  chatSessionId: string;
  status: "deleted";
  deletedAt: string;
  purgeAt: string;
};

export type AgentChatSessionResponse = {
  chatSessionId: string;
  status: string;
  expiresAt: string;
  title: string | null;
  lastMessageAt: string | null;
  messages: AgentChatMessage[];
  pendingActions: AgentPendingAction[];
  kyc?: {
    stage: AgentKycStage;
    status: string;
    nextPrompt?: string | null;
    verificationUrl?: string | null;
    requiresAgreements: boolean;
  };
};

export type AgentKycMode = "assist_only" | "chat_collect";

export type AgentKycHelpContext = {
  source: "application_submit" | "status_check";
  errorCode?: string;
  message?: string;
  failedFields?: string[];
};

export type AgentChatMessageContext = {
  kycMode?: AgentKycMode;
  kycHelpContext?: AgentKycHelpContext;
};

export type AgentChatMessageRequest = {
  message: string;
  context?: AgentChatMessageContext;
};

export type AgentChatMessageResponse = {
  chatSessionId: string;
  assistantMessage: string;
  events: ChatEventEnvelope[];
};

export type AgentActionConfirmResponse = {
  actionId: string;
  status: string;
  workflowId?: string;
  assistantMessage?: string;
  events?: ChatEventEnvelope[];
  progress?: AgentPurchaseProgress;
  billingSummary?: AgentBillingSummary;
  billingDetails?: AgentBillingDetails;
  orderId?: string | null;
  quoteId?: string | null;
  paymentStatus?: string | null;
  message?: string;
};

export type AgentActionConfirmRequest = {
  billingOverride?: AgentBillingDetails;
};

export type AgentActionStatusResponse = {
  actionId: string;
  status: AgentPurchaseProgressStatus | string;
  workflowId?: string;
  orderId?: string | null;
  quoteId?: string | null;
  paymentStatus?: string | null;
  message?: string | null;
  assistantMessage?: string | null;
  progress?: AgentPurchaseProgress;
  billingSummary?: AgentBillingSummary;
  billingDetails?: AgentBillingDetails;
};
