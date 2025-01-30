import { ZodError } from "zod";
export type FormState = {
  status: "UNSET" | "SUCCESS" | "ERROR";
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  timestamp: number;
};

export const EMPTY_FORM_STATE: FormState = {
  status: "UNSET" as const,
  message: "",
  fieldErrors: {},
  timestamp: Date.now(),
};
export const fromErrorToFormState = (error: unknown) => {
  // if validation error with Zod, return first error message
  if (error instanceof ZodError) {
    return {
      message: error.errors[0].message,
    };
    // if another error instance, return error message
    // e.g. database error
  } else if (error instanceof Error) {
    return {
      message: error.message,
    };
    // if not an error instance but something else crashed
    // return generic error message
  } else {
    return {
      message: "An unknown error occurred",
    };
  }
};

export const toFormState = (
  status: FormState["status"],
  message: string,
): FormState => {
  return {
    status,
    message,
    fieldErrors: {},
    timestamp: Date.now(),
  };
};
