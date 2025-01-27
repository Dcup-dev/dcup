import { useMemo } from "react";

const errorMessagesMap = {
  AccessDenied:
    "Access denied. You do not have permission to perform this action.",
  AdapterError:
    "An unexpected error occurred while interacting with the adapter.",
  CallbackRouteError: "An error occurred during the callback processing.",
  ErrorPageLoop: "An error page loop has been detected.",
  EventError: "An unexpected error occurred while handling an event.",
  InvalidCallbackUrl: "The provided callback URL is invalid.",
  CredentialsSignin: "The credentials provided were invalid.",
  InvalidEndpoints: "Invalid configuration detected for endpoints.",
  InvalidCheck: "A security check failed during the authentication process.",
  JWTSessionError:
    "There was an issue with the JSON Web Token during your session.",
  MissingAdapter: "The database adapter is missing.",
  MissingAdapterMethods:
    "Essential methods are missing from the database adapter.",
  MissingAuthorize:
    "The authorization method is missing from the credentials provider.",
  MissingSecret: "The secret required for session encryption is missing.",
  OAuthAccountNotLinked:
    "Your account is not linked. Please use your primary sign-in method.",
  OAuthCallbackError: "An error occurred during the OAuth callback.",
  OAuthProfileParseError:
    "There was an error parsing your profile data from the OAuth provider.",
  SessionTokenError: "There was an error with your session token.",
  OAuthSignInError: "An error occurred during the OAuth sign-in process.",
  EmailSignInError: "An error occurred during the email sign-in process.",
  SignOutError: "An error occurred during the sign-out process.",
  UnknownAction: "An unknown action was requested.",
  UnsupportedStrategy: "The requested strategy is not supported.",
  InvalidProvider: "The specified provider is invalid or not supported.",
  UntrustedHost: "The host is not trusted.",
  Verification: "An error occurred during verification.",
  MissingCSRF: "A CSRF token is missing or invalid.",
  AccountNotLinked: "Your account is not linked properly.",
  DuplicateConditionalUI: "Duplicate conditional UI configuration detected.",
  MissingWebAuthnAutocomplete: "Missing WebAuthn autocomplete configuration.",
  WebAuthnVerificationError: "An error occurred during WebAuthn verification.",
  ExperimentalFeatureNotEnabled:
    "An experimental feature is being accessed but not enabled.",
};
export const useSignInErrorMessage = (errorType: string) => {
  const errorMessage = useMemo(() => {
    return errorMessagesMap[errorType as keyof typeof errorMessagesMap] || "An unknown error occurred. Please try again.";
  }, [errorType]);

  return errorMessage;
};
